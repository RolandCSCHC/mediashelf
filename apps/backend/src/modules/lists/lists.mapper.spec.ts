import type {
  CustomList as PrismaCustomList,
  CustomListItem as PrismaCustomListItem,
  MediaItem as PrismaMediaItem,
} from '@prisma/client';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';
import {
  toCustomList,
  toCustomListDetail,
  toCustomListEntry,
  toMediaListMembership,
} from './lists.mapper';

function buildPrismaMediaItem(
  overrides: Partial<PrismaMediaItem> = {},
): PrismaMediaItem {
  return {
    id: 'media_1',
    userId: 'user_1',
    tmdbId: 10,
    type: 'SERIES',
    title: 'Show',
    description: null,
    posterPath: null,
    backdropPath: null,
    releaseDate: null,
    genres: [],
    runtime: null,
    status: 'WATCHING',
    downloaded: false,
    notes: null,
    dateWatched: null,
    createdAt: new Date('2024-02-01T00:00:00.000Z'),
    updatedAt: new Date('2024-02-02T00:00:00.000Z'),
    ...overrides,
  };
}

function buildPrismaList(
  overrides: Partial<PrismaCustomList> = {},
): PrismaCustomList {
  return {
    id: 'list_1',
    userId: 'user_1',
    name: 'Favorites',
    description: 'Top picks',
    createdAt: new Date('2024-03-01T00:00:00.000Z'),
    updatedAt: new Date('2024-03-02T00:00:00.000Z'),
    ...overrides,
  };
}

function buildPrismaListItem(
  overrides: Partial<PrismaCustomListItem> = {},
): PrismaCustomListItem {
  return {
    listId: 'list_1',
    mediaItemId: 'media_1',
    currentSeason: 2,
    currentEpisode: 5,
    addedAt: new Date('2024-03-05T12:00:00.000Z'),
    ...overrides,
  };
}

describe('lists.mapper', () => {
  describe('toCustomList', () => {
    it('maps list fields and item count', () => {
      const result = toCustomList({
        ...buildPrismaList(),
        _count: { items: 3 },
      });

      expect(result).toEqual({
        id: 'list_1',
        userId: 'user_1',
        name: 'Favorites',
        description: 'Top picks',
        itemCount: 3,
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-02T00:00:00.000Z',
      });
    });

    it('allows null description', () => {
      const result = toCustomList({
        ...buildPrismaList({ description: null }),
        _count: { items: 0 },
      });

      expect(result.description).toBeNull();
      expect(result.itemCount).toBe(0);
    });
  });

  describe('toCustomListEntry', () => {
    it('maps progress and nested media item', () => {
      const mediaItem = buildPrismaMediaItem();
      const result = toCustomListEntry({
        ...buildPrismaListItem(),
        mediaItem,
      });

      expect(result.listId).toBe('list_1');
      expect(result.mediaItemId).toBe('media_1');
      expect(result.currentSeason).toBe(2);
      expect(result.currentEpisode).toBe(5);
      expect(result.addedAt).toBe('2024-03-05T12:00:00.000Z');
      expect(result.mediaItem.type).toBe(MediaType.SERIES);
      expect(result.mediaItem.status).toBe(MediaStatus.WATCHING);
      expect(result.mediaItem.title).toBe('Show');
    });

    it('preserves null progress fields', () => {
      const result = toCustomListEntry({
        ...buildPrismaListItem({
          currentSeason: null,
          currentEpisode: null,
        }),
        mediaItem: buildPrismaMediaItem({ type: 'MOVIE', status: 'WATCHLIST' }),
      });

      expect(result.currentSeason).toBeNull();
      expect(result.currentEpisode).toBeNull();
    });
  });

  describe('toCustomListDetail', () => {
    it('includes mapped items', () => {
      const result = toCustomListDetail({
        ...buildPrismaList(),
        _count: { items: 1 },
        items: [
          {
            ...buildPrismaListItem(),
            mediaItem: buildPrismaMediaItem(),
          },
        ],
      });

      expect(result.itemCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.mediaItemId).toBe('media_1');
      expect(result.name).toBe('Favorites');
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.itemIds).toEqual(['media_1']);
    });
  });

  describe('toMediaListMembership', () => {
    it('maps membership from list relation', () => {
      const result = toMediaListMembership({
        ...buildPrismaListItem(),
        list: { id: 'list_1', name: 'Favorites' },
      });

      expect(result).toEqual({
        listId: 'list_1',
        listName: 'Favorites',
        currentSeason: 2,
        currentEpisode: 5,
        addedAt: '2024-03-05T12:00:00.000Z',
      });
    });
  });
});

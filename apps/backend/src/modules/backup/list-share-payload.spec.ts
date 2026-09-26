import type { CustomListEntry, MediaItem } from '@mediashelf/shared-types';
import {
  LIBRARY_BACKUP_VERSION,
  MediaStatus,
  MediaType,
} from '@mediashelf/shared-types';
import { toBackupMediaItem, toListSharePayload } from './list-share-payload';

function buildMedia(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: 'media_1',
    userId: 'user_1',
    tmdbId: 550,
    type: MediaType.MOVIE,
    title: 'Fight Club',
    description: 'A film',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    releaseDate: '1999-10-15T00:00:00.000Z',
    lastAirDate: null,
    genres: ['Drama'],
    runtime: 139,
    notes: 'private note',
    dateWatched: '2024-01-02T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function buildEntry(
  media: MediaItem,
  overrides: Partial<
    Pick<
      CustomListEntry,
      'status' | 'downloaded' | 'currentSeason' | 'currentEpisode'
    >
  > = {},
): CustomListEntry {
  return {
    listId: 'list_1',
    mediaItemId: media.id,
    status: MediaStatus.WATCHLIST,
    downloaded: false,
    currentSeason: null,
    currentEpisode: null,
    addedAt: '2024-03-01T00:00:00.000Z',
    mediaItem: media,
    ...overrides,
  };
}

describe('toBackupMediaItem', () => {
  it('keeps notes and date watched for a full library export', () => {
    const media = toBackupMediaItem(buildMedia());

    expect(media.notes).toBe('private note');
    expect(media.dateWatched).toBe('2024-01-02T00:00:00.000Z');
    expect(media.ref).toBe('media_1');
  });
});

describe('toListSharePayload', () => {
  const movie = buildMedia();
  const series = buildMedia({
    id: 'media_2',
    tmdbId: null,
    type: MediaType.SERIES,
    title: 'Manual show',
    notes: 'spoiler',
    dateWatched: null,
  });

  it('exports one list in the library backup format without private media fields', () => {
    const payload = toListSharePayload(
      {
        name: 'Sci-fi',
        description: 'Favorites',
        defaultStatus: MediaStatus.WATCHLIST,
        defaultDownloaded: false,
        items: [
          buildEntry(movie, {
            status: MediaStatus.WATCHING,
            downloaded: true,
          }),
          buildEntry(series, {
            currentSeason: 2,
            currentEpisode: 4,
          }),
        ],
      },
      '2026-09-26T12:00:00.000Z',
    );

    expect(payload).toEqual({
      version: LIBRARY_BACKUP_VERSION,
      exportedAt: '2026-09-26T12:00:00.000Z',
      media: [
        expect.objectContaining({
          ref: 'media_1',
          tmdbId: 550,
          title: 'Fight Club',
          notes: null,
          dateWatched: null,
        }),
        expect.objectContaining({
          ref: 'media_2',
          tmdbId: null,
          type: MediaType.SERIES,
          title: 'Manual show',
          notes: null,
          dateWatched: null,
        }),
      ],
      lists: [
        {
          name: 'Sci-fi',
          description: 'Favorites',
          defaultStatus: MediaStatus.WATCHLIST,
          defaultDownloaded: false,
          items: [
            {
              mediaRef: 'media_1',
              status: MediaStatus.WATCHING,
              downloaded: true,
              currentSeason: null,
              currentEpisode: null,
            },
            {
              mediaRef: 'media_2',
              status: MediaStatus.WATCHLIST,
              downloaded: false,
              currentSeason: 2,
              currentEpisode: 4,
            },
          ],
        },
      ],
    });
  });

  it('exports an empty list as a backup with no media', () => {
    const payload = toListSharePayload(
      {
        name: 'Sci-fi',
        description: null,
        defaultStatus: null,
        defaultDownloaded: null,
        items: [],
      },
      '2026-09-26T12:00:00.000Z',
    );

    expect(payload.media).toEqual([]);
    expect(payload.lists).toEqual([
      {
        name: 'Sci-fi',
        description: null,
        defaultStatus: null,
        defaultDownloaded: null,
        items: [],
      },
    ]);
  });
});

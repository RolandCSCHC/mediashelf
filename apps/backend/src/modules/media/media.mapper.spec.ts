import type { MediaItem as PrismaMediaItem } from '@prisma/client';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';
import { toMediaItem } from './media.mapper';

function buildPrismaMediaItem(
  overrides: Partial<PrismaMediaItem> = {},
): PrismaMediaItem {
  return {
    id: 'media_1',
    userId: 'user_1',
    tmdbId: 42,
    type: 'MOVIE',
    title: 'Example',
    description: 'A film',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    releaseDate: new Date('2020-01-15T00:00:00.000Z'),
    genres: ['Drama'],
    runtime: 120,
    status: 'WATCHLIST',
    downloaded: false,
    notes: 'note',
    dateWatched: null,
    createdAt: new Date('2024-01-01T12:00:00.000Z'),
    updatedAt: new Date('2024-01-02T12:00:00.000Z'),
    ...overrides,
  };
}

describe('toMediaItem', () => {
  it('maps prisma fields and converts dates to ISO strings', () => {
    const result = toMediaItem(buildPrismaMediaItem());

    expect(result).toEqual({
      id: 'media_1',
      userId: 'user_1',
      tmdbId: 42,
      type: MediaType.MOVIE,
      title: 'Example',
      description: 'A film',
      posterPath: '/poster.jpg',
      backdropPath: '/backdrop.jpg',
      releaseDate: '2020-01-15T00:00:00.000Z',
      genres: ['Drama'],
      runtime: 120,
      status: MediaStatus.WATCHLIST,
      downloaded: false,
      notes: 'note',
      dateWatched: null,
      createdAt: '2024-01-01T12:00:00.000Z',
      updatedAt: '2024-01-02T12:00:00.000Z',
    });
  });

  it('maps null optional dates and nullable fields', () => {
    const result = toMediaItem(
      buildPrismaMediaItem({
        tmdbId: null,
        description: null,
        posterPath: null,
        backdropPath: null,
        releaseDate: null,
        runtime: null,
        notes: null,
        dateWatched: null,
        type: 'SERIES',
        status: 'WATCHED',
      }),
    );

    expect(result.tmdbId).toBeNull();
    expect(result.description).toBeNull();
    expect(result.posterPath).toBeNull();
    expect(result.backdropPath).toBeNull();
    expect(result.releaseDate).toBeNull();
    expect(result.runtime).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.dateWatched).toBeNull();
    expect(result.type).toBe(MediaType.SERIES);
    expect(result.status).toBe(MediaStatus.WATCHED);
  });

  it('converts dateWatched to ISO when present', () => {
    const result = toMediaItem(
      buildPrismaMediaItem({
        dateWatched: new Date('2023-06-01T18:30:00.000Z'),
        status: 'WATCHED',
      }),
    );

    expect(result.dateWatched).toBe('2023-06-01T18:30:00.000Z');
  });
});

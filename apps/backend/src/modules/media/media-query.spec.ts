import {
  MediaSortBy,
  MediaStatus,
  hasDateArrived,
  isReleasedUpcoming,
  releaseAvailability,
  relevantAirDate,
  startOfTomorrowUtc,
} from '@mediashelf/shared-types';
import {
  buildDateArrivedWhere,
  buildMediaItemOrderBy,
  buildMediaItemWhere,
} from './media-query';

describe('buildMediaItemOrderBy', () => {
  it('defaults to title A–Z', () => {
    expect(buildMediaItemOrderBy()).toEqual([{ title: 'asc' }, { id: 'asc' }]);
  });

  it('sorts by title A–Z', () => {
    expect(buildMediaItemOrderBy(MediaSortBy.TITLE)).toEqual([
      { title: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('sorts by date added newest first', () => {
    expect(buildMediaItemOrderBy(MediaSortBy.DATE_ADDED)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });
});

describe('release date arrival', () => {
  const now = new Date('2026-08-22T15:00:00.000Z');

  it('treats today as arrived and tomorrow as not', () => {
    expect(hasDateArrived('2026-08-22T00:00:00.000Z', now)).toBe(true);
    expect(hasDateArrived('2026-08-21T00:00:00.000Z', now)).toBe(true);
    expect(hasDateArrived('2026-08-23T00:00:00.000Z', now)).toBe(false);
    expect(hasDateArrived(null, now)).toBe(false);
  });

  it('uses lastAirDate for series when present', () => {
    expect(
      relevantAirDate({
        type: 'SERIES',
        releaseDate: '2005-08-04T00:00:00.000Z',
        lastAirDate: '2026-08-20T00:00:00.000Z',
      }),
    ).toBe('2026-08-20T00:00:00.000Z');
  });

  it('flags only Upcoming titles whose date has arrived', () => {
    const movie = {
      type: 'MOVIE' as const,
      releaseDate: '2026-07-01T00:00:00.000Z',
      lastAirDate: null,
    };

    expect(isReleasedUpcoming(movie, MediaStatus.UPCOMING, now)).toBe(true);
    expect(isReleasedUpcoming(movie, MediaStatus.WATCHLIST, now)).toBe(false);
  });

  it('badges any title whose date has arrived, regardless of status', () => {
    const past = {
      type: 'MOVIE' as const,
      releaseDate: '2026-07-01T00:00:00.000Z',
      lastAirDate: null,
    };
    const future = {
      type: 'SERIES' as const,
      releaseDate: '2026-12-01T00:00:00.000Z',
      lastAirDate: '2026-12-15T00:00:00.000Z',
    };
    const undated = {
      type: 'MOVIE' as const,
      releaseDate: null,
      lastAirDate: null,
    };

    expect(releaseAvailability(past, now)).toBe('out');
    expect(releaseAvailability(future, now)).toBe('upcoming');
    expect(releaseAvailability(undated, now)).toBeNull();
  });

  it('builds a Prisma cutoff at the next UTC day', () => {
    expect(buildDateArrivedWhere(now)).toEqual({
      OR: [
        { type: 'MOVIE', releaseDate: { lt: startOfTomorrowUtc(now) } },
        { type: 'SERIES', lastAirDate: { lt: startOfTomorrowUtc(now) } },
        {
          type: 'SERIES',
          lastAirDate: null,
          releaseDate: { lt: startOfTomorrowUtc(now) },
        },
      ],
    });
  });

  it('restricts released=true to Upcoming titles with an arrived date', () => {
    const where = buildMediaItemWhere({ released: true }, now);

    expect(where).toEqual({
      AND: [{}, { status: MediaStatus.UPCOMING }, buildDateArrivedWhere(now)],
    });
  });
});

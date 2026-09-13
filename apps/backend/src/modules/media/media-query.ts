import {
  MediaSortBy,
  MediaStatus,
  startOfTomorrowUtc,
  type ListMediaQuery,
} from '@mediashelf/shared-types';
import type { Prisma } from '@prisma/client';

export function buildDateArrivedWhere(
  now = new Date(),
): Prisma.MediaItemWhereInput {
  const beforeTomorrow = startOfTomorrowUtc(now);

  return {
    OR: [
      { type: 'MOVIE', releaseDate: { lt: beforeTomorrow } },
      { type: 'SERIES', lastAirDate: { lt: beforeTomorrow } },
      {
        type: 'SERIES',
        lastAirDate: null,
        releaseDate: { lt: beforeTomorrow },
      },
    ],
  };
}

export function buildMediaItemWhere(
  filters: ListMediaQuery,
): Prisma.MediaItemWhereInput {
  const where: Prisma.MediaItemWhereInput = {};

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.genre) {
    where.genres = { has: filters.genre };
  }

  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' };
  }

  return where;
}

/** Library filters for status, downloaded, and released look at list memberships. */
export function buildLibraryMembershipWhere(
  filters: ListMediaQuery,
  now = new Date(),
): Prisma.MediaItemWhereInput[] {
  const clauses: Prisma.MediaItemWhereInput[] = [];

  if (filters.status) {
    clauses.push({
      listItems: { some: { status: filters.status } },
    });
  }

  if (filters.downloaded === true) {
    clauses.push({
      listItems: { some: { downloaded: true } },
    });
  } else if (filters.downloaded === false) {
    clauses.push({
      NOT: { listItems: { some: { downloaded: true } } },
    });
  }

  if (filters.released !== undefined) {
    clauses.push({
      listItems: { some: { status: MediaStatus.UPCOMING } },
    });
    clauses.push(
      filters.released
        ? buildDateArrivedWhere(now)
        : { NOT: buildDateArrivedWhere(now) },
    );
  }

  return clauses;
}

export function buildMediaItemOrderBy(
  sortBy: MediaSortBy = MediaSortBy.TITLE,
): Prisma.MediaItemOrderByWithRelationInput[] {
  switch (sortBy) {
    case MediaSortBy.DATE_ADDED:
      return [{ createdAt: 'desc' }, { id: 'asc' }];
    case MediaSortBy.RELEASE_DATE:
      return [{ releaseDate: 'desc' }, { id: 'asc' }];
    case MediaSortBy.DATE_WATCHED:
      return [{ dateWatched: 'desc' }, { id: 'asc' }];
    case MediaSortBy.TITLE:
    default:
      return [{ title: 'asc' }, { id: 'asc' }];
  }
}

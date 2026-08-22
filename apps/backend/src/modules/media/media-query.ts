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
  now = new Date(),
): Prisma.MediaItemWhereInput {
  const where: Prisma.MediaItemWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.downloaded !== undefined) {
    where.downloaded = filters.downloaded;
  }

  if (filters.genre) {
    where.genres = { has: filters.genre };
  }

  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' };
  }

  if (filters.released === undefined) {
    return where;
  }

  const releasedClause: Prisma.MediaItemWhereInput[] = [
    { status: MediaStatus.UPCOMING },
    filters.released
      ? buildDateArrivedWhere(now)
      : { NOT: buildDateArrivedWhere(now) },
  ];

  return { AND: [where, ...releasedClause] };
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

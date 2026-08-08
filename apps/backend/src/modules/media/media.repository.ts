import { Injectable } from '@nestjs/common';
import type {
  MediaItem as PrismaMediaItem,
  MediaStatus,
  MediaType,
  Prisma,
} from '@prisma/client';
import { MediaSortBy, type ListMediaQuery } from '@mediashelf/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import type { TmdbMediaDetails } from '../tmdb/tmdb.service';

export type MediaListFilters = ListMediaQuery;

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(
    userId: string,
    filters: MediaListFilters = {},
  ): Promise<PrismaMediaItem[]> {
    return this.prisma.mediaItem.findMany({
      where: this.buildWhere(userId, filters),
      orderBy: this.buildOrderBy(filters),
    });
  }

  findByIdForUser(id: string, userId: string): Promise<PrismaMediaItem | null> {
    return this.prisma.mediaItem.findFirst({
      where: { id, userId },
    });
  }

  findByUserAndTmdb(
    userId: string,
    tmdbId: number,
    type: MediaType,
  ): Promise<PrismaMediaItem | null> {
    return this.prisma.mediaItem.findUnique({
      where: {
        userId_tmdbId_type: { userId, tmdbId, type },
      },
    });
  }

  createFromTmdb(
    userId: string,
    details: TmdbMediaDetails,
  ): Promise<PrismaMediaItem> {
    return this.prisma.mediaItem.create({
      data: {
        userId,
        tmdbId: details.tmdbId,
        type: details.type,
        title: details.title,
        description: details.description,
        posterPath: details.posterPath,
        backdropPath: details.backdropPath,
        releaseDate: details.releaseDate,
        genres: details.genres,
        runtime: details.runtime,
      },
    });
  }

  async updateOwned(
    id: string,
    userId: string,
    data: {
      status?: MediaStatus;
      downloaded?: boolean;
      dateWatched?: Date | null;
    },
  ): Promise<PrismaMediaItem | null> {
    const result = await this.prisma.mediaItem.updateMany({
      where: { id, userId },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForUser(id, userId);
  }

  async deleteOwned(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.mediaItem.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  private buildWhere(
    userId: string,
    filters: MediaListFilters,
  ): Prisma.MediaItemWhereInput {
    const where: Prisma.MediaItemWhereInput = { userId };

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

    if (filters.listId) {
      where.listItems = {
        some: {
          listId: filters.listId,
          list: { userId },
        },
      };
    }

    return where;
  }

  private buildOrderBy(
    filters: MediaListFilters,
  ): Prisma.MediaItemOrderByWithRelationInput {
    const sortBy = filters.sortBy ?? MediaSortBy.DATE_ADDED;

    switch (sortBy) {
      case MediaSortBy.TITLE:
        return { title: 'asc' };
      case MediaSortBy.RELEASE_DATE:
        return { releaseDate: 'desc' };
      case MediaSortBy.DATE_WATCHED:
        return { dateWatched: 'desc' };
      case MediaSortBy.DATE_ADDED:
      default:
        return { createdAt: 'desc' };
    }
  }
}

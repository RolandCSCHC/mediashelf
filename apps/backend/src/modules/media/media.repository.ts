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

  countOwnedByIds(userId: string, ids: string[]): Promise<number> {
    return this.prisma.mediaItem.count({
      where: {
        userId,
        id: { in: ids },
      },
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

  /** Match a manual (non-TMDB) title for merge import. */
  findManualByTitle(
    userId: string,
    title: string,
    type: MediaType,
  ): Promise<PrismaMediaItem | null> {
    return this.prisma.mediaItem.findFirst({
      where: {
        userId,
        type,
        tmdbId: null,
        title: { equals: title, mode: 'insensitive' },
      },
    });
  }

  createFromTmdb(
    userId: string,
    details: TmdbMediaDetails,
    options?: {
      status?: MediaStatus;
      downloaded?: boolean;
      notes?: string | null;
    },
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
        ...(options?.status !== undefined ? { status: options.status } : {}),
        ...(options?.downloaded !== undefined
          ? { downloaded: options.downloaded }
          : {}),
        ...(options?.notes !== undefined ? { notes: options.notes } : {}),
      },
    });
  }

  createManual(
    userId: string,
    data: {
      type: MediaType;
      title: string;
      description: string | null;
      releaseDate: Date | null;
      notes: string | null;
      status?: MediaStatus;
    },
  ): Promise<PrismaMediaItem> {
    return this.prisma.mediaItem.create({
      data: {
        userId,
        tmdbId: null,
        type: data.type,
        title: data.title,
        description: data.description,
        posterPath: null,
        backdropPath: null,
        releaseDate: data.releaseDate,
        genres: [],
        runtime: null,
        notes: data.notes,
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  /** Restore a full media snapshot from a library backup (TMDB or manual). */
  createFromSnapshot(
    userId: string,
    data: {
      tmdbId: number | null;
      type: MediaType;
      title: string;
      description: string | null;
      posterPath: string | null;
      backdropPath: string | null;
      releaseDate: Date | null;
      genres: string[];
      runtime: number | null;
      status: MediaStatus;
      downloaded: boolean;
      notes: string | null;
      dateWatched: Date | null;
    },
  ): Promise<PrismaMediaItem> {
    return this.prisma.mediaItem.create({
      data: {
        userId,
        tmdbId: data.tmdbId,
        type: data.type,
        title: data.title,
        description: data.description,
        posterPath: data.posterPath,
        backdropPath: data.backdropPath,
        releaseDate: data.releaseDate,
        genres: data.genres,
        runtime: data.runtime,
        status: data.status,
        downloaded: data.downloaded,
        notes: data.notes,
        dateWatched: data.dateWatched,
      },
    });
  }

  async updateOwned(
    id: string,
    userId: string,
    data: {
      status?: MediaStatus;
      downloaded?: boolean;
      notes?: string | null;
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

    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
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

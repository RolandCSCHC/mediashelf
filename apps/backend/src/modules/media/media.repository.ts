import { Injectable } from '@nestjs/common';
import type {
  MediaItem as PrismaMediaItem,
  MediaStatus,
  MediaType,
  Prisma,
} from '@prisma/client';
import type { ListMediaQuery } from '@mediashelf/shared-types';
import { resolvePagination, uniqueSortedGenres } from '../../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import type { TmdbMediaDetails } from '../tmdb/tmdb.service';
import { buildMediaItemOrderBy, buildMediaItemWhere } from './media-query';

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

  async findPageByUser(
    userId: string,
    filters: MediaListFilters = {},
  ): Promise<{
    items: PrismaMediaItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    genres: string[];
  }> {
    const where = this.buildWhere(userId, filters);

    const [total, genreRows] = await Promise.all([
      this.prisma.mediaItem.count({ where }),
      this.prisma.mediaItem.findMany({
        where: { userId },
        select: { genres: true },
      }),
    ]);

    const pagination = resolvePagination(filters.page, filters.pageSize, total);
    const items = await this.prisma.mediaItem.findMany({
      where,
      orderBy: this.buildOrderBy(filters),
      ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      ...(pagination.take !== undefined ? { take: pagination.take } : {}),
    });

    return {
      items,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
      genres: uniqueSortedGenres(genreRows.map((row) => row.genres)),
    };
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

  findOwnedByIds(userId: string, ids: string[]): Promise<PrismaMediaItem[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.mediaItem.findMany({
      where: {
        userId,
        id: { in: ids },
      },
    });
  }

  findTmdbSeriesMissingLastAirDate(
    userId: string,
    ids: string[],
  ): Promise<PrismaMediaItem[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.mediaItem.findMany({
      where: {
        userId,
        id: { in: ids },
        type: 'SERIES',
        tmdbId: { not: null },
        lastAirDate: null,
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
        lastAirDate: details.lastAirDate,
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
      lastAirDate: Date | null;
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
        lastAirDate: data.lastAirDate,
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
      lastAirDate?: Date | null;
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
    const where: Prisma.MediaItemWhereInput = {
      userId,
      ...buildMediaItemWhere(filters),
    };

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
  ): Prisma.MediaItemOrderByWithRelationInput[] {
    return buildMediaItemOrderBy(filters.sortBy);
  }
}

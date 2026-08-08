import { Injectable } from '@nestjs/common';
import type {
  MediaItem as PrismaMediaItem,
  MediaStatus,
  MediaType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { TmdbMediaDetails } from '../tmdb/tmdb.service';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string): Promise<PrismaMediaItem[]> {
    return this.prisma.mediaItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
}

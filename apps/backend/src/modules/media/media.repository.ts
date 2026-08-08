import { Injectable } from '@nestjs/common';
import type { MediaItem as PrismaMediaItem, MediaType } from '@prisma/client';
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
}

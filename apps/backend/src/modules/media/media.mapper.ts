import type { MediaItem as PrismaMediaItem } from '@prisma/client';
import type { MediaItem } from '@mediashelf/shared-types';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';

export function toMediaItem(item: PrismaMediaItem): MediaItem {
  return {
    id: item.id,
    userId: item.userId,
    tmdbId: item.tmdbId,
    type: item.type as MediaType,
    title: item.title,
    description: item.description,
    posterPath: item.posterPath,
    backdropPath: item.backdropPath,
    releaseDate: item.releaseDate?.toISOString() ?? null,
    genres: item.genres,
    runtime: item.runtime,
    status: item.status as MediaStatus,
    downloaded: item.downloaded,
    currentSeason: item.currentSeason,
    currentEpisode: item.currentEpisode,
    dateWatched: item.dateWatched?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

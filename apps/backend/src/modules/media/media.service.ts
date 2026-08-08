import { ConflictException, Injectable } from '@nestjs/common';
import type { MediaItem } from '@mediashelf/shared-types';
import { MediaType } from '@mediashelf/shared-types';
import { TmdbService } from '../tmdb/tmdb.service';
import { MediaRepository } from './media.repository';
import { toMediaItem } from './media.mapper';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly tmdbService: TmdbService,
  ) {}

  async listForUser(userId: string): Promise<MediaItem[]> {
    const items = await this.mediaRepository.findByUser(userId);
    return items.map(toMediaItem);
  }

  async importFromTmdb(
    userId: string,
    tmdbId: number,
    type: MediaType,
  ): Promise<MediaItem> {
    const existing = await this.mediaRepository.findByUserAndTmdb(
      userId,
      tmdbId,
      type,
    );

    if (existing) {
      throw new ConflictException('This title is already in your library');
    }

    const details = await this.tmdbService.getDetails(tmdbId, type);
    const created = await this.mediaRepository.createFromTmdb(userId, details);
    return toMediaItem(created);
  }
}

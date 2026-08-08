import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ListMediaQuery, MediaItem } from '@mediashelf/shared-types';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';
import { TmdbService } from '../tmdb/tmdb.service';
import { MediaRepository } from './media.repository';
import { toMediaItem } from './media.mapper';
import type { UpdateMediaItemDto } from './dto/update-media-item.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly tmdbService: TmdbService,
  ) {}

  async listForUser(
    userId: string,
    filters: ListMediaQuery = {},
  ): Promise<MediaItem[]> {
    const items = await this.mediaRepository.findByUser(userId, filters);
    return items.map(toMediaItem);
  }

  async getForUser(userId: string, id: string): Promise<MediaItem> {
    const item = await this.mediaRepository.findByIdForUser(id, userId);
    if (!item) {
      throw new NotFoundException('Media item not found');
    }
    return toMediaItem(item);
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

  async updateForUser(
    userId: string,
    id: string,
    dto: UpdateMediaItemDto,
  ): Promise<MediaItem> {
    if (
      dto.status === undefined &&
      dto.downloaded === undefined &&
      dto.dateWatched === undefined
    ) {
      throw new BadRequestException('No fields to update');
    }

    const existing = await this.mediaRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException('Media item not found');
    }

    let dateWatched: Date | null | undefined = undefined;

    if (dto.dateWatched !== undefined) {
      dateWatched = dto.dateWatched ? new Date(dto.dateWatched) : null;
    } else if (dto.status !== undefined) {
      if (dto.status === MediaStatus.WATCHED && !existing.dateWatched) {
        dateWatched = new Date();
      } else if (dto.status !== MediaStatus.WATCHED) {
        dateWatched = null;
      }
    }

    const updated = await this.mediaRepository.updateOwned(id, userId, {
      ...(dto.status !== undefined
        ? { status: dto.status as typeof existing.status }
        : {}),
      ...(dto.downloaded !== undefined ? { downloaded: dto.downloaded } : {}),
      ...(dateWatched !== undefined ? { dateWatched } : {}),
    });

    if (!updated) {
      throw new NotFoundException('Media item not found');
    }

    return toMediaItem(updated);
  }

  async deleteForUser(userId: string, id: string): Promise<void> {
    const deleted = await this.mediaRepository.deleteOwned(id, userId);
    if (!deleted) {
      throw new NotFoundException('Media item not found');
    }
  }
}

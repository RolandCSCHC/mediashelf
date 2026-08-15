import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ListMediaQuery,
  MediaItem,
  PaginatedMediaResponse,
} from '@mediashelf/shared-types';
import { MediaStatus, MediaType } from '@mediashelf/shared-types';
import { TmdbService } from '../tmdb/tmdb.service';
import { MediaRepository } from './media.repository';
import { toMediaItem } from './media.mapper';
import type { CreateManualMediaDto } from './dto/create-manual-media.dto';
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

  async listPageForUser(
    userId: string,
    filters: ListMediaQuery = {},
  ): Promise<PaginatedMediaResponse> {
    const page = await this.mediaRepository.findPageByUser(userId, filters);
    return {
      items: page.items.map(toMediaItem),
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
      genres: page.genres,
    };
  }

  async getForUser(userId: string, id: string): Promise<MediaItem> {
    const item = await this.mediaRepository.findByIdForUser(id, userId);
    if (!item) {
      throw new NotFoundException('Media item not found');
    }
    return toMediaItem(item);
  }

  async findByTmdbForUser(
    userId: string,
    tmdbId: number,
    type: MediaType,
  ): Promise<MediaItem | null> {
    const item = await this.mediaRepository.findByUserAndTmdb(
      userId,
      tmdbId,
      type,
    );
    return item ? toMediaItem(item) : null;
  }

  async findManualByTitleForUser(
    userId: string,
    title: string,
    type: MediaType,
  ): Promise<MediaItem | null> {
    const item = await this.mediaRepository.findManualByTitle(
      userId,
      title,
      type,
    );
    return item ? toMediaItem(item) : null;
  }

  async assertOwnedIds(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const ownedCount = await this.mediaRepository.countOwnedByIds(userId, ids);
    if (ownedCount !== ids.length) {
      throw new NotFoundException('One or more media items were not found');
    }
  }

  async importFromTmdb(
    userId: string,
    tmdbId: number,
    type: MediaType,
    options?: {
      status?: MediaStatus;
      downloaded?: boolean;
      notes?: string | null;
    },
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
    const created = await this.mediaRepository.createFromTmdb(
      userId,
      details,
      options,
    );
    return toMediaItem(created);
  }

  async createManual(
    userId: string,
    dto: CreateManualMediaDto,
  ): Promise<MediaItem> {
    const title = dto.title.trim();
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    const description =
      dto.description === undefined || dto.description === null
        ? null
        : dto.description.trim() || null;

    const notes =
      dto.notes === undefined || dto.notes === null
        ? null
        : dto.notes.trim() || null;

    const releaseDate =
      dto.releaseYear !== undefined
        ? new Date(Date.UTC(dto.releaseYear, 0, 1))
        : null;

    const created = await this.mediaRepository.createManual(userId, {
      type: dto.type as MediaType,
      title,
      description,
      releaseDate,
      notes,
      ...(dto.status !== undefined
        ? { status: dto.status as MediaStatus }
        : {}),
    });

    return toMediaItem(created);
  }

  async createFromSnapshot(
    userId: string,
    data: {
      tmdbId: number | null;
      type: MediaType;
      title: string;
      description: string | null;
      posterPath: string | null;
      backdropPath: string | null;
      releaseDate: string | null;
      genres: string[];
      runtime: number | null;
      status: MediaStatus;
      downloaded: boolean;
      notes: string | null;
      dateWatched: string | null;
    },
  ): Promise<MediaItem> {
    const title = data.title.trim();
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    const created = await this.mediaRepository.createFromSnapshot(userId, {
      tmdbId: data.tmdbId,
      type: data.type,
      title,
      description: data.description?.trim() || null,
      posterPath: data.posterPath,
      backdropPath: data.backdropPath,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
      genres: data.genres,
      runtime: data.runtime,
      status: data.status,
      downloaded: data.downloaded,
      notes: data.notes?.trim() || null,
      dateWatched: data.dateWatched ? new Date(data.dateWatched) : null,
    });

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
      dto.notes === undefined &&
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

    const notes =
      dto.notes === undefined
        ? undefined
        : dto.notes === null
          ? null
          : dto.notes.trim() || null;

    const updated = await this.mediaRepository.updateOwned(id, userId, {
      ...(dto.status !== undefined
        ? { status: dto.status as typeof existing.status }
        : {}),
      ...(dto.downloaded !== undefined ? { downloaded: dto.downloaded } : {}),
      ...(notes !== undefined ? { notes } : {}),
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

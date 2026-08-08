import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CustomList,
  CustomListDetail,
  CustomListEntry,
  MediaListMembership,
} from '@mediashelf/shared-types';
import { MediaType } from '@mediashelf/shared-types';
import { Prisma } from '@prisma/client';
import { MediaService } from '../media/media.service';
import { ListsRepository } from './lists.repository';
import {
  toCustomList,
  toCustomListDetail,
  toCustomListEntry,
  toMediaListMembership,
} from './lists.mapper';
import type { CreateCustomListDto } from './dto/create-custom-list.dto';
import type { UpdateCustomListDto } from './dto/update-custom-list.dto';
import type { AddListItemDto } from './dto/add-list-item.dto';
import type { AddListItemsDto } from './dto/add-list-items.dto';
import type { UpdateListItemDto } from './dto/update-list-item.dto';

@Injectable()
export class ListsService {
  constructor(
    private readonly listsRepository: ListsRepository,
    private readonly mediaService: MediaService,
  ) {}

  async listForUser(userId: string): Promise<CustomList[]> {
    const lists = await this.listsRepository.findByUser(userId);
    return lists.map(toCustomList);
  }

  async getForUser(userId: string, id: string): Promise<CustomListDetail> {
    const list = await this.listsRepository.findDetailForUser(id, userId);
    if (!list) {
      throw new NotFoundException('List not found');
    }
    return toCustomListDetail(list);
  }

  async createForUser(
    userId: string,
    dto: CreateCustomListDto,
  ): Promise<CustomList> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('List name is required');
    }

    const existing = await this.listsRepository.findByUserAndName(userId, name);
    if (existing) {
      throw new ConflictException('A list with this name already exists');
    }

    const created = await this.listsRepository.create(userId, {
      name,
      description: dto.description?.trim() || null,
    });
    return toCustomList(created);
  }

  async updateForUser(
    userId: string,
    id: string,
    dto: UpdateCustomListDto,
  ): Promise<CustomList> {
    if (dto.name === undefined && dto.description === undefined) {
      throw new BadRequestException('No fields to update');
    }

    const existing = await this.listsRepository.findByIdForUser(id, userId);
    if (!existing) {
      throw new NotFoundException('List not found');
    }

    let name: string | undefined;
    if (dto.name !== undefined) {
      name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('List name is required');
      }

      const clash = await this.listsRepository.findByUserAndName(userId, name);
      if (clash && clash.id !== id) {
        throw new ConflictException('A list with this name already exists');
      }
    }

    const updated = await this.listsRepository.updateOwned(id, userId, {
      ...(name !== undefined ? { name } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description?.trim() || null }
        : {}),
    });

    if (!updated) {
      throw new NotFoundException('List not found');
    }

    return toCustomList(updated);
  }

  async deleteForUser(userId: string, id: string): Promise<void> {
    const deleted = await this.listsRepository.deleteOwned(id, userId);
    if (!deleted) {
      throw new NotFoundException('List not found');
    }
  }

  async membershipsForMedia(
    userId: string,
    mediaItemId: string,
  ): Promise<MediaListMembership[]> {
    await this.mediaService.getForUser(userId, mediaItemId);
    const rows = await this.listsRepository.findMembershipsForMedia(
      mediaItemId,
      userId,
    );
    return rows.map(toMediaListMembership);
  }

  async addItemForUser(
    userId: string,
    listId: string,
    dto: AddListItemDto,
  ): Promise<CustomListDetail> {
    const list = await this.listsRepository.findByIdForUser(listId, userId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const media = await this.mediaService.getForUser(userId, dto.mediaItemId);
    this.assertProgressAllowed(media.type, dto);

    const already = await this.listsRepository.findListItem(
      listId,
      dto.mediaItemId,
    );
    if (already) {
      throw new ConflictException('This title is already in the list');
    }

    try {
      await this.listsRepository.addItem(listId, dto.mediaItemId, {
        currentSeason: dto.currentSeason,
        currentEpisode: dto.currentEpisode,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This title is already in the list');
      }
      throw error;
    }

    return this.getForUser(userId, listId);
  }

  async addItemsForUser(
    userId: string,
    listId: string,
    dto: AddListItemsDto,
  ): Promise<CustomListDetail> {
    const list = await this.listsRepository.findByIdForUser(listId, userId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const mediaItemIds = Array.from(new Set(dto.mediaItemIds));
    if (mediaItemIds.length === 0) {
      throw new BadRequestException('At least one media item is required');
    }

    await this.mediaService.assertOwnedIds(userId, mediaItemIds);
    await this.listsRepository.addItems(listId, mediaItemIds);

    return this.getForUser(userId, listId);
  }

  async updateItemForUser(
    userId: string,
    listId: string,
    mediaItemId: string,
    dto: UpdateListItemDto,
  ): Promise<CustomListEntry> {
    if (dto.currentSeason === undefined && dto.currentEpisode === undefined) {
      throw new BadRequestException('No fields to update');
    }

    const list = await this.listsRepository.findByIdForUser(listId, userId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const media = await this.mediaService.getForUser(userId, mediaItemId);
    this.assertProgressAllowed(media.type, dto);

    const existing = await this.listsRepository.findListItem(
      listId,
      mediaItemId,
    );
    if (!existing) {
      throw new NotFoundException('List item not found');
    }

    const updated = await this.listsRepository.updateItem(listId, mediaItemId, {
      ...(dto.currentSeason !== undefined
        ? { currentSeason: dto.currentSeason }
        : {}),
      ...(dto.currentEpisode !== undefined
        ? { currentEpisode: dto.currentEpisode }
        : {}),
    });

    if (!updated) {
      throw new NotFoundException('List item not found');
    }

    return toCustomListEntry(updated);
  }

  async removeItemForUser(
    userId: string,
    listId: string,
    mediaItemId: string,
  ): Promise<void> {
    const list = await this.listsRepository.findByIdForUser(listId, userId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const removed = await this.listsRepository.removeItem(listId, mediaItemId);
    if (!removed) {
      throw new NotFoundException('List item not found');
    }
  }

  private assertProgressAllowed(
    type: MediaType,
    dto: {
      currentSeason?: number | null;
      currentEpisode?: number | null;
    },
  ): void {
    if (
      (dto.currentSeason !== undefined || dto.currentEpisode !== undefined) &&
      type !== MediaType.SERIES
    ) {
      throw new BadRequestException(
        'Series progress can only be set on TV series',
      );
    }
  }
}

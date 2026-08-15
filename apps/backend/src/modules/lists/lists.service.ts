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
  ListMediaQuery,
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
import type { MoveListItemDto } from './dto/move-list-item.dto';

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

  async getForUser(
    userId: string,
    id: string,
    filters: ListMediaQuery = {},
  ): Promise<CustomListDetail> {
    const page = await this.listsRepository.findDetailPageForUser(
      id,
      userId,
      filters,
    );
    if (!page) {
      throw new NotFoundException('List not found');
    }

    return toCustomListDetail(
      {
        ...page.list,
        items: page.items,
      },
      {
        page: page.page,
        pageSize: page.pageSize,
        total: page.total,
        totalPages: page.totalPages,
        genres: page.genres,
        itemIds: page.itemIds,
      },
    );
  }

  async listDetailsForUser(userId: string): Promise<CustomListDetail[]> {
    const lists = await this.listsRepository.findAllDetailsForUser(userId);
    return lists.map((list) => toCustomListDetail(list));
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

  /** Find a list by exact name, or create it if missing. */
  async ensureByName(
    userId: string,
    name: string,
    description?: string | null,
  ): Promise<CustomList> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('List name is required');
    }

    const existing = await this.listsRepository.findByUserAndName(
      userId,
      trimmed,
    );
    if (existing) {
      const withCount = await this.listsRepository.findByIdForUser(
        existing.id,
        userId,
      );
      if (!withCount) {
        throw new NotFoundException('List not found');
      }
      return toCustomList(withCount);
    }

    const created = await this.listsRepository.create(userId, {
      name: trimmed,
      description: description?.trim() || null,
    });
    return toCustomList(created);
  }

  async addOwnedItemsToList(
    userId: string,
    listId: string,
    mediaItemIds: string[],
  ): Promise<void> {
    const list = await this.listsRepository.findByIdForUser(listId, userId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const uniqueIds = Array.from(new Set(mediaItemIds));
    if (uniqueIds.length === 0) {
      return;
    }

    await this.mediaService.assertOwnedIds(userId, uniqueIds);
    await this.listsRepository.addItems(listId, uniqueIds);
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

  /** Add a list membership if missing. Does not overwrite existing progress. */
  async addItemIfMissing(
    userId: string,
    listId: string,
    mediaItemId: string,
    progress?: {
      currentSeason?: number | null;
      currentEpisode?: number | null;
    },
  ): Promise<'added' | 'skipped'> {
    const list = await this.listsRepository.findByIdForUser(listId, userId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const media = await this.mediaService.getForUser(userId, mediaItemId);
    this.assertProgressAllowed(media.type, progress ?? {});

    const already = await this.listsRepository.findListItem(
      listId,
      mediaItemId,
    );
    if (already) {
      return 'skipped';
    }

    try {
      await this.listsRepository.addItem(listId, mediaItemId, {
        currentSeason: progress?.currentSeason,
        currentEpisode: progress?.currentEpisode,
      });
      return 'added';
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return 'skipped';
      }
      throw error;
    }
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

  async moveItemForUser(
    userId: string,
    sourceListId: string,
    mediaItemId: string,
    dto: MoveListItemDto,
  ): Promise<MediaListMembership[]> {
    if (dto.targetListId === sourceListId) {
      throw new BadRequestException('Cannot move a title to the same list');
    }

    const sourceList = await this.listsRepository.findByIdForUser(
      sourceListId,
      userId,
    );
    if (!sourceList) {
      throw new NotFoundException('List not found');
    }

    const targetList = await this.listsRepository.findByIdForUser(
      dto.targetListId,
      userId,
    );
    if (!targetList) {
      throw new NotFoundException('Target list not found');
    }

    await this.mediaService.getForUser(userId, mediaItemId);

    const sourceItem = await this.listsRepository.findListItem(
      sourceListId,
      mediaItemId,
    );
    if (!sourceItem) {
      throw new NotFoundException('List item not found');
    }

    const alreadyInTarget = await this.listsRepository.findListItem(
      dto.targetListId,
      mediaItemId,
    );
    if (alreadyInTarget) {
      throw new ConflictException('This title is already in the target list');
    }

    try {
      await this.listsRepository.moveItem(
        sourceListId,
        dto.targetListId,
        mediaItemId,
        {
          currentSeason: sourceItem.currentSeason,
          currentEpisode: sourceItem.currentEpisode,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This title is already in the target list');
      }
      throw error;
    }

    return this.membershipsForMedia(userId, mediaItemId);
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

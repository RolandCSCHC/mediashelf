import { Injectable } from '@nestjs/common';
import type {
  CustomList as PrismaCustomList,
  CustomListItem as PrismaCustomListItem,
  MediaItem as PrismaMediaItem,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ListWithCount = PrismaCustomList & { _count: { items: number } };

type ListItemWithMedia = PrismaCustomListItem & {
  mediaItem: PrismaMediaItem;
};

type ListWithItems = PrismaCustomList & {
  _count: { items: number };
  items: ListItemWithMedia[];
};

type MembershipRow = PrismaCustomListItem & {
  list: Pick<PrismaCustomList, 'id' | 'name'>;
};

@Injectable()
export class ListsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string): Promise<ListWithCount[]> {
    return this.prisma.customList.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
  }

  findByIdForUser(id: string, userId: string): Promise<ListWithCount | null> {
    return this.prisma.customList.findFirst({
      where: { id, userId },
      include: { _count: { select: { items: true } } },
    });
  }

  findDetailForUser(id: string, userId: string): Promise<ListWithItems | null> {
    return this.prisma.customList.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { items: true } },
        items: {
          include: { mediaItem: true },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
  }

  findByUserAndName(
    userId: string,
    name: string,
  ): Promise<PrismaCustomList | null> {
    return this.prisma.customList.findUnique({
      where: {
        userId_name: { userId, name },
      },
    });
  }

  create(
    userId: string,
    data: { name: string; description?: string | null },
  ): Promise<ListWithCount> {
    return this.prisma.customList.create({
      data: {
        userId,
        name: data.name,
        description: data.description ?? null,
      },
      include: { _count: { select: { items: true } } },
    });
  }

  async updateOwned(
    id: string,
    userId: string,
    data: { name?: string; description?: string | null },
  ): Promise<ListWithCount | null> {
    const result = await this.prisma.customList.updateMany({
      where: { id, userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForUser(id, userId);
  }

  async deleteOwned(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.customList.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  async addItem(
    listId: string,
    mediaItemId: string,
    progress?: {
      currentSeason?: number | null;
      currentEpisode?: number | null;
    },
  ): Promise<void> {
    await this.prisma.customListItem.create({
      data: {
        listId,
        mediaItemId,
        currentSeason: progress?.currentSeason ?? null,
        currentEpisode: progress?.currentEpisode ?? null,
      },
    });
  }

  async addItems(listId: string, mediaItemIds: string[]): Promise<number> {
    if (mediaItemIds.length === 0) {
      return 0;
    }

    const result = await this.prisma.customListItem.createMany({
      data: mediaItemIds.map((mediaItemId) => ({
        listId,
        mediaItemId,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }

  async updateItem(
    listId: string,
    mediaItemId: string,
    data: {
      currentSeason?: number | null;
      currentEpisode?: number | null;
    },
  ): Promise<ListItemWithMedia | null> {
    const result = await this.prisma.customListItem.updateMany({
      where: { listId, mediaItemId },
      data: {
        ...(data.currentSeason !== undefined
          ? { currentSeason: data.currentSeason }
          : {}),
        ...(data.currentEpisode !== undefined
          ? { currentEpisode: data.currentEpisode }
          : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.customListItem.findUnique({
      where: {
        listId_mediaItemId: { listId, mediaItemId },
      },
      include: { mediaItem: true },
    });
  }

  async removeItem(listId: string, mediaItemId: string): Promise<boolean> {
    const result = await this.prisma.customListItem.deleteMany({
      where: { listId, mediaItemId },
    });
    return result.count > 0;
  }

  findListItem(
    listId: string,
    mediaItemId: string,
  ): Promise<PrismaCustomListItem | null> {
    return this.prisma.customListItem.findUnique({
      where: {
        listId_mediaItemId: { listId, mediaItemId },
      },
    });
  }

  findMembershipsForMedia(
    mediaItemId: string,
    userId: string,
  ): Promise<MembershipRow[]> {
    return this.prisma.customListItem.findMany({
      where: {
        mediaItemId,
        list: { userId },
      },
      include: {
        list: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        list: { name: 'asc' },
      },
    });
  }
}

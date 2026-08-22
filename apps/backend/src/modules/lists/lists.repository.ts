import { Injectable } from '@nestjs/common';
import type {
  CustomList as PrismaCustomList,
  CustomListItem as PrismaCustomListItem,
  MediaItem as PrismaMediaItem,
  Prisma,
} from '@prisma/client';
import type { ListMediaQuery } from '@mediashelf/shared-types';
import { resolvePagination, uniqueSortedGenres } from '../../common/pagination';
import {
  buildDateArrivedWhere,
  buildMediaItemOrderBy,
  buildMediaItemWhere,
} from '../media/media-query';
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

  async findDetailPageForUser(
    id: string,
    userId: string,
    filters: ListMediaQuery = {},
  ): Promise<{
    list: ListWithCount;
    items: ListItemWithMedia[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    genres: string[];
    itemIds: string[];
  } | null> {
    const list = await this.findByIdForUser(id, userId);
    if (!list) {
      return null;
    }

    const { status, downloaded, released, ...mediaFilters } = filters;
    const itemWhere: Prisma.CustomListItemWhereInput = {
      listId: id,
      AND: [
        ...(status ? [{ status }] : []),
        ...(downloaded !== undefined ? [{ downloaded }] : []),
        ...(released !== undefined ? [{ status: 'UPCOMING' as const }] : []),
        {
          mediaItem: {
            AND: [
              buildMediaItemWhere(mediaFilters),
              ...(released === true ? [buildDateArrivedWhere()] : []),
              ...(released === false ? [{ NOT: buildDateArrivedWhere() }] : []),
            ],
          },
        },
      ],
    };

    const [total, metaRows] = await Promise.all([
      this.prisma.customListItem.count({ where: itemWhere }),
      this.prisma.customListItem.findMany({
        where: { listId: id },
        select: {
          mediaItemId: true,
          mediaItem: { select: { genres: true } },
        },
      }),
    ]);

    const pagination = resolvePagination(filters.page, filters.pageSize, total);
    const items = await this.prisma.customListItem.findMany({
      where: itemWhere,
      include: { mediaItem: true },
      orderBy: buildMediaItemOrderBy(filters.sortBy).map((order) => ({
        mediaItem: order,
      })),
      ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      ...(pagination.take !== undefined ? { take: pagination.take } : {}),
    });

    return {
      list,
      items,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
      genres: uniqueSortedGenres(metaRows.map((row) => row.mediaItem.genres)),
      itemIds: metaRows.map((row) => row.mediaItemId),
    };
  }

  findAllDetailsForUser(userId: string): Promise<ListWithItems[]> {
    return this.prisma.customList.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
        items: {
          include: { mediaItem: true },
          orderBy: { addedAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
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
    data: {
      name: string;
      description?: string | null;
      defaultStatus?: PrismaCustomList['defaultStatus'];
      defaultDownloaded?: boolean | null;
    },
  ): Promise<ListWithCount> {
    return this.prisma.customList.create({
      data: {
        userId,
        name: data.name,
        description: data.description ?? null,
        defaultStatus: data.defaultStatus ?? null,
        defaultDownloaded: data.defaultDownloaded ?? null,
      },
      include: { _count: { select: { items: true } } },
    });
  }

  async updateOwned(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string | null;
      defaultStatus?: PrismaCustomList['defaultStatus'];
      defaultDownloaded?: boolean | null;
    },
  ): Promise<ListWithCount | null> {
    const result = await this.prisma.customList.updateMany({
      where: { id, userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.defaultStatus !== undefined
          ? { defaultStatus: data.defaultStatus }
          : {}),
        ...(data.defaultDownloaded !== undefined
          ? { defaultDownloaded: data.defaultDownloaded }
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
    data?: {
      status?: PrismaCustomListItem['status'];
      downloaded?: boolean;
      currentSeason?: number | null;
      currentEpisode?: number | null;
    },
  ): Promise<void> {
    await this.prisma.customListItem.create({
      data: {
        listId,
        mediaItemId,
        ...(data?.status !== undefined ? { status: data.status } : {}),
        ...(data?.downloaded !== undefined
          ? { downloaded: data.downloaded }
          : {}),
        currentSeason: data?.currentSeason ?? null,
        currentEpisode: data?.currentEpisode ?? null,
      },
    });
  }

  async addItems(
    listId: string,
    items: {
      mediaItemId: string;
      status: PrismaCustomListItem['status'];
      downloaded: boolean;
    }[],
  ): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    const result = await this.prisma.customListItem.createMany({
      data: items.map((item) => ({
        listId,
        mediaItemId: item.mediaItemId,
        status: item.status,
        downloaded: item.downloaded,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }

  async updateItem(
    listId: string,
    mediaItemId: string,
    data: {
      status?: PrismaCustomListItem['status'];
      downloaded?: boolean;
      currentSeason?: number | null;
      currentEpisode?: number | null;
    },
  ): Promise<ListItemWithMedia | null> {
    const result = await this.prisma.customListItem.updateMany({
      where: { listId, mediaItemId },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.downloaded !== undefined
          ? { downloaded: data.downloaded }
          : {}),
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

  async moveItem(
    sourceListId: string,
    targetListId: string,
    mediaItemId: string,
    data: {
      status: PrismaCustomListItem['status'];
      downloaded: boolean;
      currentSeason: number | null;
      currentEpisode: number | null;
    },
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.customListItem.create({
        data: {
          listId: targetListId,
          mediaItemId,
          status: data.status,
          downloaded: data.downloaded,
          currentSeason: data.currentSeason,
          currentEpisode: data.currentEpisode,
        },
      }),
      this.prisma.customListItem.delete({
        where: {
          listId_mediaItemId: { listId: sourceListId, mediaItemId },
        },
      }),
    ]);
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

  async findExistingMediaItemIds(
    listId: string,
    mediaItemIds: string[],
  ): Promise<string[]> {
    if (mediaItemIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.customListItem.findMany({
      where: { listId, mediaItemId: { in: mediaItemIds } },
      select: { mediaItemId: true },
    });
    return rows.map((row) => row.mediaItemId);
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

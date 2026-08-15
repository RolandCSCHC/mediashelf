import type {
  CustomList as PrismaCustomList,
  CustomListItem as PrismaCustomListItem,
  MediaItem as PrismaMediaItem,
} from '@prisma/client';
import type {
  CustomList,
  CustomListDetail,
  CustomListEntry,
  MediaListMembership,
  PaginationMeta,
} from '@mediashelf/shared-types';
import { MediaStatus } from '@mediashelf/shared-types';
import { toMediaItem } from '../media/media.mapper';
import { uniqueSortedGenres } from '../../common/pagination';

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

export function toCustomList(list: ListWithCount): CustomList {
  return {
    id: list.id,
    userId: list.userId,
    name: list.name,
    description: list.description,
    defaultStatus: list.defaultStatus as MediaStatus | null,
    defaultDownloaded: list.defaultDownloaded,
    itemCount: list._count.items,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}

export function toCustomListEntry(entry: ListItemWithMedia): CustomListEntry {
  return {
    listId: entry.listId,
    mediaItemId: entry.mediaItemId,
    status: entry.status as MediaStatus,
    downloaded: entry.downloaded,
    currentSeason: entry.currentSeason,
    currentEpisode: entry.currentEpisode,
    addedAt: entry.addedAt.toISOString(),
    mediaItem: toMediaItem(entry.mediaItem),
  };
}

export function toCustomListDetail(
  list: ListWithItems,
  pagination?: PaginationMeta & { genres?: string[]; itemIds?: string[] },
): CustomListDetail {
  const items = list.items.map(toCustomListEntry);
  const itemIds = pagination?.itemIds ?? items.map((item) => item.mediaItemId);
  const genres =
    pagination?.genres ??
    uniqueSortedGenres(items.map((item) => item.mediaItem.genres));
  const total = pagination?.total ?? items.length;
  const pageSize = pagination?.pageSize ?? total;
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? (total === 0 ? 0 : 1);

  return {
    ...toCustomList(list),
    items,
    page,
    pageSize,
    total,
    totalPages,
    genres,
    itemIds,
  };
}

export function toMediaListMembership(
  entry: MembershipRow,
): MediaListMembership {
  return {
    listId: entry.list.id,
    listName: entry.list.name,
    status: entry.status as MediaStatus,
    downloaded: entry.downloaded,
    currentSeason: entry.currentSeason,
    currentEpisode: entry.currentEpisode,
    addedAt: entry.addedAt.toISOString(),
  };
}

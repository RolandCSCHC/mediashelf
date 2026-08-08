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
} from '@mediashelf/shared-types';
import { toMediaItem } from '../media/media.mapper';

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
    itemCount: list._count.items,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}

export function toCustomListEntry(entry: ListItemWithMedia): CustomListEntry {
  return {
    listId: entry.listId,
    mediaItemId: entry.mediaItemId,
    currentSeason: entry.currentSeason,
    currentEpisode: entry.currentEpisode,
    addedAt: entry.addedAt.toISOString(),
    mediaItem: toMediaItem(entry.mediaItem),
  };
}

export function toCustomListDetail(list: ListWithItems): CustomListDetail {
  return {
    ...toCustomList(list),
    items: list.items.map(toCustomListEntry),
  };
}

export function toMediaListMembership(
  entry: MembershipRow,
): MediaListMembership {
  return {
    listId: entry.list.id,
    listName: entry.list.name,
    currentSeason: entry.currentSeason,
    currentEpisode: entry.currentEpisode,
    addedAt: entry.addedAt.toISOString(),
  };
}

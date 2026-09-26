import { MediaSortBy } from '@mediashelf/shared-types';
import type { Prisma } from '@prisma/client';
import { buildMediaItemOrderBy } from '../media/media-query';

/**
 * List pages share the library sort options. Date added is the membership
 * timestamp (`CustomListItem.addedAt`), not when the title entered the library.
 */
export function buildListItemOrderBy(
  sortBy: MediaSortBy = MediaSortBy.TITLE,
): Prisma.CustomListItemOrderByWithRelationInput[] {
  if (sortBy === MediaSortBy.DATE_ADDED) {
    return [{ addedAt: 'desc' }, { mediaItemId: 'asc' }];
  }

  return buildMediaItemOrderBy(sortBy).map((order) => ({
    mediaItem: order,
  }));
}

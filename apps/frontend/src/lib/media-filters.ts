import {
  MediaSortBy,
  MediaStatus,
  MediaType,
  type MediaItem,
} from '@mediashelf/shared-types';
import type { MessageKey } from '@/i18n';

export const MEDIA_SORT_OPTIONS: {
  value: MediaSortBy;
  labelKey: MessageKey;
}[] = [
  { value: MediaSortBy.TITLE, labelKey: 'filters.sortTitle' },
  { value: MediaSortBy.DATE_ADDED, labelKey: 'filters.sortDateAdded' },
  { value: MediaSortBy.RELEASE_DATE, labelKey: 'filters.sortReleaseDate' },
  { value: MediaSortBy.DATE_WATCHED, labelKey: 'filters.sortDateWatched' },
];

export const MEDIA_TYPE_FILTER_OPTIONS: {
  value: '' | MediaType;
  labelKey: MessageKey;
}[] = [
  { value: '', labelKey: 'filters.allTypes' },
  { value: MediaType.MOVIE, labelKey: 'common.movies' },
  { value: MediaType.SERIES, labelKey: 'common.series' },
];

export const MEDIA_STATUS_FILTER_OPTIONS: {
  value: '' | MediaStatus;
  labelKey: MessageKey;
}[] = [
  { value: '', labelKey: 'filters.allStatuses' },
  { value: MediaStatus.WATCHLIST, labelKey: 'status.watchlist' },
  { value: MediaStatus.WATCHING, labelKey: 'status.watching' },
  { value: MediaStatus.WATCHED, labelKey: 'status.watched' },
  { value: MediaStatus.UPCOMING, labelKey: 'status.upcoming' },
];

export const DOWNLOADED_FILTER_OPTIONS: {
  value: '' | 'true' | 'false';
  labelKey: MessageKey;
}[] = [
  { value: '', labelKey: 'filters.anyDownload' },
  { value: 'true', labelKey: 'common.downloaded' },
  { value: 'false', labelKey: 'common.notDownloaded' },
];

export type MediaFilterSortInput = {
  status: '' | MediaStatus;
  type: '' | MediaType;
  genre: string;
  downloaded: '' | 'true' | 'false';
  search?: string;
  sortBy: MediaSortBy;
};

export function matchesMediaFilters(
  item: MediaItem,
  filters: MediaFilterSortInput,
): boolean {
  if (filters.status && item.status !== filters.status) {
    return false;
  }
  if (filters.type && item.type !== filters.type) {
    return false;
  }
  if (filters.genre && !item.genres.includes(filters.genre)) {
    return false;
  }
  if (filters.downloaded === 'true' && !item.downloaded) {
    return false;
  }
  if (filters.downloaded === 'false' && item.downloaded) {
    return false;
  }
  const query = filters.search?.trim().toLowerCase();
  if (query && !item.title.toLowerCase().includes(query)) {
    return false;
  }
  return true;
}

function compareNullableDates(
  a: string | null,
  b: string | null,
  direction: 'asc' | 'desc',
): number {
  if (a === null && b === null) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }
  const diff = new Date(a).getTime() - new Date(b).getTime();
  return direction === 'asc' ? diff : -diff;
}

export function compareMediaItems(
  a: MediaItem,
  b: MediaItem,
  sortBy: MediaSortBy,
): number {
  switch (sortBy) {
    case MediaSortBy.DATE_ADDED:
      return compareNullableDates(a.createdAt, b.createdAt, 'desc');
    case MediaSortBy.RELEASE_DATE:
      return compareNullableDates(a.releaseDate, b.releaseDate, 'desc');
    case MediaSortBy.DATE_WATCHED:
      return compareNullableDates(a.dateWatched, b.dateWatched, 'desc');
    case MediaSortBy.TITLE:
    default:
      return a.title.localeCompare(b.title);
  }
}

export function formatSeriesProgress(
  season: number | null,
  episode: number | null,
): string | null {
  if (season === null && episode === null) {
    return null;
  }
  if (season !== null && episode !== null) {
    return `S${season} · E${episode}`;
  }
  if (season !== null) {
    return `S${season}`;
  }
  return `E${episode}`;
}

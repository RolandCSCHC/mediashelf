import {
  MediaSortBy,
  MediaStatus,
  MediaType,
  type MediaItem,
} from '@mediashelf/shared-types';

export const MEDIA_SORT_OPTIONS: {
  value: MediaSortBy;
  label: string;
}[] = [
  { value: MediaSortBy.DATE_ADDED, label: 'Date added' },
  { value: MediaSortBy.TITLE, label: 'Title' },
  { value: MediaSortBy.RELEASE_DATE, label: 'Release date' },
  { value: MediaSortBy.DATE_WATCHED, label: 'Date watched' },
];

export const MEDIA_TYPE_FILTER_OPTIONS: {
  value: '' | MediaType;
  label: string;
}[] = [
  { value: '', label: 'All types' },
  { value: MediaType.MOVIE, label: 'Movies' },
  { value: MediaType.SERIES, label: 'Series' },
];

export const MEDIA_STATUS_FILTER_OPTIONS: {
  value: '' | MediaStatus;
  label: string;
}[] = [
  { value: '', label: 'All statuses' },
  { value: MediaStatus.WATCHLIST, label: 'Watchlist' },
  { value: MediaStatus.WATCHING, label: 'Watching' },
  { value: MediaStatus.WATCHED, label: 'Watched' },
  { value: MediaStatus.FUTURE, label: 'Future' },
];

export const DOWNLOADED_FILTER_OPTIONS: {
  value: '' | 'true' | 'false';
  label: string;
}[] = [
  { value: '', label: 'Any download state' },
  { value: 'true', label: 'Downloaded' },
  { value: 'false', label: 'Not downloaded' },
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
    case MediaSortBy.TITLE:
      return a.title.localeCompare(b.title);
    case MediaSortBy.RELEASE_DATE:
      return compareNullableDates(a.releaseDate, b.releaseDate, 'desc');
    case MediaSortBy.DATE_WATCHED:
      return compareNullableDates(a.dateWatched, b.dateWatched, 'desc');
    case MediaSortBy.DATE_ADDED:
    default:
      return compareNullableDates(a.createdAt, b.createdAt, 'desc');
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

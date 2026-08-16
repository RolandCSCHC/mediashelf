export enum MediaType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

export enum MediaStatus {
  WATCHLIST = 'WATCHLIST',
  WATCHING = 'WATCHING',
  WATCHED = 'WATCHED',
  UPCOMING = 'UPCOMING',
}

export enum MediaSortBy {
  TITLE = 'TITLE',
  DATE_ADDED = 'DATE_ADDED',
  RELEASE_DATE = 'RELEASE_DATE',
  DATE_WATCHED = 'DATE_WATCHED',
}

export interface User {
  id: string;
  googleId: string | null;
  microsoftId: string | null;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Authenticated user profile returned by the API (no provider ids). */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LogoutResponse {
  success: true;
}

export interface MediaItem {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

/** Create a library item without a TMDB match. */
export interface CreateManualMediaRequest {
  title: string;
  type: MediaType;
  releaseYear?: number;
  description?: string | null;
  notes?: string | null;
  status?: MediaStatus;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  database: 'up' | 'down';
}

/** Normalized TMDB search hit (movie or series). */
export interface TmdbSearchResult {
  tmdbId: number;
  type: MediaType;
  title: string;
  overview: string | null;
  posterPath: string | null;
  releaseDate: string | null;
  popularity: number;
}

export interface TmdbSearchResponse {
  results: TmdbSearchResult[];
}

/** Person credit shown on a TMDB title preview (cast or crew). */
export interface TmdbPerson {
  tmdbId: number;
  name: string;
  role: string | null;
  profilePath: string | null;
}

/** Full TMDB title preview (details + credits) before adding to the library. */
export interface TmdbTitleDetails {
  tmdbId: number;
  type: MediaType;
  title: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  genres: string[];
  runtime: number | null;
  voteAverage: number | null;
  seasonCount: number | null;
  directors: TmdbPerson[];
  creators: TmdbPerson[];
  cast: TmdbPerson[];
}

export interface ImportMediaRequest {
  tmdbId: number;
  type: MediaType;
}

export interface UpdateMediaItemRequest {
  status?: MediaStatus;
  downloaded?: boolean;
  notes?: string | null;
  dateWatched?: string | null;
}

/** Request every matching item in one page. */
export const PAGE_SIZE_ALL = 'all' as const;

export type PageSizeParam = number | typeof PAGE_SIZE_ALL;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedMediaResponse extends PaginationMeta {
  items: MediaItem[];
  /** Distinct genres across the user's full library (for filter options). */
  genres: string[];
}

export interface ListMediaQuery {
  status?: MediaStatus;
  type?: MediaType;
  genre?: string;
  downloaded?: boolean;
  listId?: string;
  search?: string;
  sortBy?: MediaSortBy;
  page?: number;
  pageSize?: PageSizeParam;
}

export interface CustomList {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  /** Status applied to list memberships when titles are added or moved into this list. */
  defaultStatus: MediaStatus | null;
  /** Downloaded flag applied to list memberships when titles are added or moved into this list. */
  defaultDownloaded: boolean | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Statuses the list UI should offer: the configured default plus Watching. */
export function allowedStatusesForList(
  defaultStatus: MediaStatus | null,
): MediaStatus[] | null {
  if (!defaultStatus) {
    return null;
  }
  if (defaultStatus === MediaStatus.WATCHING) {
    return [MediaStatus.WATCHING];
  }
  return [defaultStatus, MediaStatus.WATCHING];
}

/** Series progress, status, and downloaded flag for one title inside one list. */
export interface CustomListEntry {
  listId: string;
  mediaItemId: string;
  status: MediaStatus;
  downloaded: boolean;
  currentSeason: number | null;
  currentEpisode: number | null;
  addedAt: string;
  mediaItem: MediaItem;
}

export interface CustomListDetail extends CustomList, PaginationMeta {
  items: CustomListEntry[];
  /** Distinct genres across every title in this list (for filter options). */
  genres: string[];
  /** Every media item id in the list, including titles outside the current page. */
  itemIds: string[];
}

/** Compact membership view for a media detail page. */
export interface MediaListMembership {
  listId: string;
  listName: string;
  status: MediaStatus;
  downloaded: boolean;
  currentSeason: number | null;
  currentEpisode: number | null;
  addedAt: string;
}

export interface CreateCustomListRequest {
  name: string;
  description?: string | null;
  defaultStatus?: MediaStatus | null;
  defaultDownloaded?: boolean | null;
}

export interface UpdateCustomListRequest {
  name?: string;
  description?: string | null;
  defaultStatus?: MediaStatus | null;
  defaultDownloaded?: boolean | null;
}

export interface AddListItemRequest {
  mediaItemId: string;
  currentSeason?: number | null;
  currentEpisode?: number | null;
}

export interface AddListItemsRequest {
  mediaItemIds: string[];
}

export interface UpdateListItemRequest {
  status?: MediaStatus;
  downloaded?: boolean;
  currentSeason?: number | null;
  currentEpisode?: number | null;
}

export interface MoveListItemRequest {
  targetListId: string;
}

/** Portable library backup format (export / merge-import). */
export const LIBRARY_BACKUP_VERSION = 1 as const;

export interface LibraryBackupMediaItem {
  /** Stable within-file reference used by list memberships. */
  ref: string;
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
}

export interface LibraryBackupListItem {
  mediaRef: string;
  status?: MediaStatus;
  downloaded?: boolean;
  currentSeason: number | null;
  currentEpisode: number | null;
}

export interface LibraryBackupList {
  name: string;
  description: string | null;
  defaultStatus?: MediaStatus | null;
  defaultDownloaded?: boolean | null;
  items: LibraryBackupListItem[];
}

export interface LibraryBackupPayload {
  version: typeof LIBRARY_BACKUP_VERSION;
  exportedAt: string;
  media: LibraryBackupMediaItem[];
  lists: LibraryBackupList[];
}

export interface LibraryBackupImportRequest {
  version: typeof LIBRARY_BACKUP_VERSION;
  exportedAt?: string;
  media: LibraryBackupMediaItem[];
  lists: LibraryBackupList[];
}

export interface LibraryBackupImportResponse {
  mediaImported: number;
  mediaSkipped: number;
  listsCreated: number;
  listsReused: number;
  membershipsAdded: number;
  membershipsSkipped: number;
  errorCount: number;
  errors: string[];
}

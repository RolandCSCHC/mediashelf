export enum MediaType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

export enum MediaStatus {
  WATCHLIST = 'WATCHLIST',
  WATCHING = 'WATCHING',
  WATCHED = 'WATCHED',
  FUTURE = 'FUTURE',
}

export enum MediaSortBy {
  TITLE = 'TITLE',
  DATE_ADDED = 'DATE_ADDED',
  RELEASE_DATE = 'RELEASE_DATE',
  DATE_WATCHED = 'DATE_WATCHED',
}

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Authenticated user profile returned by the API (no googleId). */
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
  tmdbId: number;
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

export type ImportMatchConfidence = 'high' | 'medium' | 'low' | 'none';

/** One parsed line from a library .txt, with TMDB match suggestions. */
export interface ImportPreviewItem {
  key: string;
  lineNumber: number;
  rawLine: string;
  searchQuery: string;
  type: MediaType;
  status: MediaStatus;
  downloaded: boolean;
  notes: string | null;
  confidence: ImportMatchConfidence;
  selected: TmdbSearchResult | null;
  candidates: TmdbSearchResult[];
  alreadyInLibrary: boolean;
}

export interface ImportPreviewRequest {
  text: string;
}

export interface ImportPreviewResponse {
  items: ImportPreviewItem[];
  skippedEmptyLines: number;
}

export interface ImportConfirmItem {
  tmdbId: number;
  type: MediaType;
  status: MediaStatus;
  downloaded: boolean;
  notes?: string | null;
}

export interface ImportConfirmRequest {
  items: ImportConfirmItem[];
}

export interface ImportConfirmResultItem {
  tmdbId: number;
  type: MediaType;
  status: 'imported' | 'skipped_existing' | 'error';
  mediaItem?: MediaItem;
  error?: string;
}

export interface ImportConfirmResponse {
  results: ImportConfirmResultItem[];
  importedCount: number;
  skippedCount: number;
  errorCount: number;
}

export interface ListMediaQuery {
  status?: MediaStatus;
  type?: MediaType;
  genre?: string;
  downloaded?: boolean;
  listId?: string;
  sortBy?: MediaSortBy;
}

export interface CustomList {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Series progress for one title inside one list. */
export interface CustomListEntry {
  listId: string;
  mediaItemId: string;
  currentSeason: number | null;
  currentEpisode: number | null;
  addedAt: string;
  mediaItem: MediaItem;
}

export interface CustomListDetail extends CustomList {
  items: CustomListEntry[];
}

/** Compact membership view for a media detail page. */
export interface MediaListMembership {
  listId: string;
  listName: string;
  currentSeason: number | null;
  currentEpisode: number | null;
  addedAt: string;
}

export interface CreateCustomListRequest {
  name: string;
  description?: string | null;
}

export interface UpdateCustomListRequest {
  name?: string;
  description?: string | null;
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
  currentSeason?: number | null;
  currentEpisode?: number | null;
}

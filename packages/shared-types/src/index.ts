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
  currentSeason: number | null;
  currentEpisode: number | null;
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
  dateWatched?: string | null;
}

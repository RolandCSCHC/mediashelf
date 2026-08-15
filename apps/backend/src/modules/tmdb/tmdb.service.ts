import {
  Injectable,
  ServiceUnavailableException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { MediaType } from '@mediashelf/shared-types';
import type {
  TmdbSearchResult,
  TmdbTitleDetails,
} from '@mediashelf/shared-types';
import { mapMovieTitleDetails, mapSeriesTitleDetails } from './tmdb.mapper';
import type {
  TmdbMovieDetailsResponse,
  TmdbTvDetailsResponse,
} from './tmdb.types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

type TmdbMovieSearchItem = {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  popularity?: number;
};

type TmdbTvSearchItem = {
  id: number;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  first_air_date?: string;
  popularity?: number;
};

export type TmdbMediaDetails = {
  tmdbId: number;
  type: MediaType;
  title: string;
  description: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: Date | null;
  genres: string[];
  runtime: number | null;
};

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);

  private getApiKey(): string {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'TMDB_API_KEY is not configured on the server',
      );
    }
    return apiKey;
  }

  async search(
    query: string,
    type: 'MOVIE' | 'SERIES' | 'ALL' = 'ALL',
  ): Promise<TmdbSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    if (type === 'MOVIE') {
      return this.searchMovies(trimmed);
    }
    if (type === 'SERIES') {
      return this.searchSeries(trimmed);
    }

    const [movies, series] = await Promise.all([
      this.searchMovies(trimmed),
      this.searchSeries(trimmed),
    ]);

    return [...movies, ...series].sort((a, b) => b.popularity - a.popularity);
  }

  async getDetails(tmdbId: number, type: MediaType): Promise<TmdbMediaDetails> {
    if (type === MediaType.MOVIE) {
      return this.getMovieDetails(tmdbId);
    }
    return this.getSeriesDetails(tmdbId);
  }

  async getTitleDetails(
    tmdbId: number,
    type: MediaType,
  ): Promise<TmdbTitleDetails> {
    if (type === MediaType.MOVIE) {
      const movie = await this.tmdbFetch<TmdbMovieDetailsResponse>(
        `/movie/${tmdbId}`,
        { append_to_response: 'credits' },
      );
      return mapMovieTitleDetails(movie);
    }

    const series = await this.tmdbFetch<TmdbTvDetailsResponse>(
      `/tv/${tmdbId}`,
      { append_to_response: 'credits' },
    );
    return mapSeriesTitleDetails(series);
  }

  private async searchMovies(query: string): Promise<TmdbSearchResult[]> {
    const data = await this.tmdbFetch<{ results: TmdbMovieSearchItem[] }>(
      '/search/movie',
      { query },
    );

    return (data.results ?? []).map((item) => ({
      tmdbId: item.id,
      type: MediaType.MOVIE,
      title: item.title ?? 'Untitled',
      overview: item.overview || null,
      posterPath: item.poster_path ?? null,
      releaseDate: item.release_date || null,
      popularity: item.popularity ?? 0,
    }));
  }

  private async searchSeries(query: string): Promise<TmdbSearchResult[]> {
    const data = await this.tmdbFetch<{ results: TmdbTvSearchItem[] }>(
      '/search/tv',
      { query },
    );

    return (data.results ?? []).map((item) => ({
      tmdbId: item.id,
      type: MediaType.SERIES,
      title: item.name ?? 'Untitled',
      overview: item.overview || null,
      posterPath: item.poster_path ?? null,
      releaseDate: item.first_air_date || null,
      popularity: item.popularity ?? 0,
    }));
  }

  private async getMovieDetails(tmdbId: number): Promise<TmdbMediaDetails> {
    const movie = await this.tmdbFetch<TmdbMovieDetailsResponse>(
      `/movie/${tmdbId}`,
    );

    return {
      tmdbId: movie.id,
      type: MediaType.MOVIE,
      title: movie.title,
      description: movie.overview || null,
      posterPath: movie.poster_path ?? null,
      backdropPath: movie.backdrop_path ?? null,
      releaseDate: this.parseDate(movie.release_date),
      genres: (movie.genres ?? []).map((genre) => genre.name),
      runtime: movie.runtime ?? null,
    };
  }

  private async getSeriesDetails(tmdbId: number): Promise<TmdbMediaDetails> {
    const series = await this.tmdbFetch<TmdbTvDetailsResponse>(`/tv/${tmdbId}`);
    const episodeRuntime = series.episode_run_time?.[0] ?? null;

    return {
      tmdbId: series.id,
      type: MediaType.SERIES,
      title: series.name,
      description: series.overview || null,
      posterPath: series.poster_path ?? null,
      backdropPath: series.backdrop_path ?? null,
      releaseDate: this.parseDate(series.first_air_date),
      genres: (series.genres ?? []).map((genre) => genre.name),
      runtime: episodeRuntime,
    };
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async tmdbFetch<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${path}`);
    url.searchParams.set('api_key', this.getApiKey());
    url.searchParams.set('language', 'en-US');

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      this.logger.error(`TMDB request failed for ${path}`, error);
      throw new ServiceUnavailableException('Unable to reach TMDB');
    }

    if (response.status === 404) {
      throw new NotFoundException('TMDB resource not found');
    }

    if (!response.ok) {
      this.logger.error(`TMDB responded with ${response.status} for ${path}`);
      throw new ServiceUnavailableException('TMDB request failed');
    }

    return (await response.json()) as T;
  }
}

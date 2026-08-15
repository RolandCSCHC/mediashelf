import { MediaType } from '@mediashelf/shared-types';
import type { TmdbPerson, TmdbTitleDetails } from '@mediashelf/shared-types';
import type {
  TmdbCastMember,
  TmdbCreator,
  TmdbCrewMember,
  TmdbMovieDetailsResponse,
  TmdbTvDetailsResponse,
} from './tmdb.types';

export const TMDB_CAST_LIMIT = 12;

function optionalText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function optionalPositive(value?: number | null): number | null {
  if (value === undefined || value === null || value <= 0) {
    return null;
  }
  return value;
}

function optionalDate(value?: string): string | null {
  return optionalText(value);
}

function mapGenres(genres: { name: string }[] | undefined): string[] {
  return (genres ?? [])
    .map((genre) => genre.name.trim())
    .filter((name) => name.length > 0);
}

function mapPerson(
  id: number,
  name: string | undefined,
  role: string | null,
  profilePath?: string | null,
): TmdbPerson | null {
  const trimmedName = optionalText(name);
  if (!trimmedName) {
    return null;
  }

  return {
    tmdbId: id,
    name: trimmedName,
    role,
    profilePath: profilePath ?? null,
  };
}

export function mapCast(
  cast: TmdbCastMember[] | undefined,
  limit = TMDB_CAST_LIMIT,
): TmdbPerson[] {
  return [...(cast ?? [])]
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, limit)
    .map((member) =>
      mapPerson(
        member.id,
        member.name,
        optionalText(member.character),
        member.profile_path,
      ),
    )
    .filter((person): person is TmdbPerson => person !== null);
}

export function mapDirectors(crew: TmdbCrewMember[] | undefined): TmdbPerson[] {
  const seen = new Set<number>();
  const directors: TmdbPerson[] = [];

  for (const member of crew ?? []) {
    if (member.job !== 'Director' || seen.has(member.id)) {
      continue;
    }

    const person = mapPerson(
      member.id,
      member.name,
      'Director',
      member.profile_path,
    );
    if (!person) {
      continue;
    }

    seen.add(member.id);
    directors.push(person);
  }

  return directors;
}

export function mapCreators(creators: TmdbCreator[] | undefined): TmdbPerson[] {
  const seen = new Set<number>();
  const mapped: TmdbPerson[] = [];

  for (const creator of creators ?? []) {
    if (seen.has(creator.id)) {
      continue;
    }

    const person = mapPerson(
      creator.id,
      creator.name,
      'Creator',
      creator.profile_path,
    );
    if (!person) {
      continue;
    }

    seen.add(creator.id);
    mapped.push(person);
  }

  return mapped;
}

export function mapMovieTitleDetails(
  movie: TmdbMovieDetailsResponse,
): TmdbTitleDetails {
  return {
    tmdbId: movie.id,
    type: MediaType.MOVIE,
    title: optionalText(movie.title) ?? 'Untitled',
    overview: optionalText(movie.overview),
    posterPath: movie.poster_path ?? null,
    backdropPath: movie.backdrop_path ?? null,
    releaseDate: optionalDate(movie.release_date),
    genres: mapGenres(movie.genres),
    runtime: optionalPositive(movie.runtime),
    voteAverage: optionalPositive(movie.vote_average),
    seasonCount: null,
    directors: mapDirectors(movie.credits?.crew),
    creators: [],
    cast: mapCast(movie.credits?.cast),
  };
}

export function mapSeriesTitleDetails(
  series: TmdbTvDetailsResponse,
): TmdbTitleDetails {
  return {
    tmdbId: series.id,
    type: MediaType.SERIES,
    title: optionalText(series.name) ?? 'Untitled',
    overview: optionalText(series.overview),
    posterPath: series.poster_path ?? null,
    backdropPath: series.backdrop_path ?? null,
    releaseDate: optionalDate(series.first_air_date),
    genres: mapGenres(series.genres),
    runtime: optionalPositive(series.episode_run_time?.[0]),
    voteAverage: optionalPositive(series.vote_average),
    seasonCount: optionalPositive(series.number_of_seasons),
    directors: [],
    creators: mapCreators(series.created_by),
    cast: mapCast(series.credits?.cast),
  };
}

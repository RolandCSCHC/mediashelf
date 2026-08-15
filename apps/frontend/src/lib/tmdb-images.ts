const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function tmdbPosterUrl(
  posterPath: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' = 'w342',
): string | null {
  return tmdbImageUrl(posterPath, size);
}

export function tmdbBackdropUrl(
  backdropPath: string | null | undefined,
  size: 'w780' | 'w1280' = 'w1280',
): string | null {
  return tmdbImageUrl(backdropPath, size);
}

export function tmdbProfileUrl(
  profilePath: string | null | undefined,
  size: 'w185' | 'h632' = 'w185',
): string | null {
  return tmdbImageUrl(profilePath, size);
}

function tmdbImageUrl(
  path: string | null | undefined,
  size: string,
): string | null {
  if (!path) {
    return null;
  }
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

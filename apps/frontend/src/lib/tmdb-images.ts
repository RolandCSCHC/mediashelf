const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function tmdbPosterUrl(
  posterPath: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' = 'w342',
): string | null {
  if (!posterPath) {
    return null;
  }
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

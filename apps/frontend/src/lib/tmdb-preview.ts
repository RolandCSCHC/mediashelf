import { MediaType } from '@mediashelf/shared-types';

export type SearchTypeFilter = 'ALL' | 'MOVIE' | 'SERIES';
export type TmdbPreviewKind = 'movie' | 'series';

export function tmdbPreviewKind(type: MediaType): TmdbPreviewKind {
  return type === MediaType.MOVIE ? 'movie' : 'series';
}

export function mediaTypeFromPreviewKind(kind: string): MediaType | null {
  if (kind === 'movie') {
    return MediaType.MOVIE;
  }
  if (kind === 'series') {
    return MediaType.SERIES;
  }
  return null;
}

export function tmdbPreviewHref(
  type: MediaType,
  tmdbId: number,
  query?: string | null,
): string {
  const path = `/search/${tmdbPreviewKind(type)}/${tmdbId}`;
  const trimmed = query?.trim();
  if (!trimmed) {
    return path;
  }
  return `${path}?q=${encodeURIComponent(trimmed)}`;
}

export function parseSearchTypeFilter(value: string | null): SearchTypeFilter {
  if (value === 'MOVIE' || value === 'SERIES') {
    return value;
  }
  return 'ALL';
}

export function searchHref(
  query?: string | null,
  type: SearchTypeFilter = 'ALL',
): string {
  const params = new URLSearchParams();
  const trimmed = query?.trim();
  if (trimmed) {
    params.set('q', trimmed);
  }
  if (type !== 'ALL') {
    params.set('type', type);
  }
  const serialized = params.toString();
  return serialized ? `/search?${serialized}` : '/search';
}

'use client';

import Link from 'next/link';
import type { MediaType, TmdbSearchResult } from '@mediashelf/shared-types';
import { AddToLibraryButton } from '@/components/add-to-library-button';
import { useI18n } from '@/components/locale-provider';
import { formatReleaseLabel } from '@/lib/format-date';
import { tmdbPosterUrl } from '@/lib/tmdb-images';
import { tmdbPreviewHref } from '@/lib/tmdb-preview';

type SearchResultCardProps = {
  result: TmdbSearchResult;
  searchQuery?: string;
  alreadyInLibrary?: boolean;
  libraryItemId?: string | null;
  onImported?: (tmdbId: number, type: MediaType, mediaItemId: string) => void;
};

export function SearchResultCard({
  result,
  searchQuery,
  alreadyInLibrary = false,
  libraryItemId = null,
  onImported,
}: SearchResultCardProps) {
  const { t, locale } = useI18n();
  const poster = tmdbPosterUrl(result.posterPath, 'w185');
  const releaseLabel = formatReleaseLabel(result, locale);
  const href = tmdbPreviewHref(result.type, result.tmdbId, searchQuery);

  return (
    <article className="flex gap-4 rounded-lg border border-border bg-surface p-3 transition hover:border-accent/40 sm:p-4">
      <Link
        href={href}
        className="h-36 w-24 shrink-0 overflow-hidden rounded-md bg-[var(--overlay)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] sm:h-40 sm:w-28"
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
            {t('common.noPoster')}
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="font-display text-lg font-semibold text-foreground">
            <Link
              href={href}
              className="hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            >
              {result.title}
            </Link>
          </h3>
          <span className="text-xs uppercase tracking-wide text-muted">
            {result.type === 'MOVIE' ? t('common.movie') : t('common.series')}
            {releaseLabel ? ` · ${releaseLabel}` : ''}
          </span>
        </div>
        {result.overview ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted">
            {result.overview}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
          <AddToLibraryButton
            tmdbId={result.tmdbId}
            type={result.type}
            alreadyInLibrary={alreadyInLibrary}
            libraryItemId={libraryItemId}
            onImported={onImported}
          />
          <Link
            href={href}
            className="text-sm text-muted transition hover:text-foreground"
          >
            {t('searchCard.viewInfo')}
          </Link>
        </div>
      </div>
    </article>
  );
}

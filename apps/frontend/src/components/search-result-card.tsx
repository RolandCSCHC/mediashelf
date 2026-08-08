'use client';

import { useState } from 'react';
import type { MediaType, TmdbSearchResult } from '@mediashelf/shared-types';
import { importMedia } from '@/lib/api';
import { tmdbPosterUrl } from '@/lib/tmdb-images';
import { Button } from '@/components/ui/button';

type SearchResultCardProps = {
  result: TmdbSearchResult;
  alreadyInLibrary?: boolean;
  onImported?: (tmdbId: number, type: MediaType) => void;
};

export function SearchResultCard({
  result,
  alreadyInLibrary = false,
  onImported,
}: SearchResultCardProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState(alreadyInLibrary);
  const [error, setError] = useState<string | null>(null);
  const poster = tmdbPosterUrl(result.posterPath, 'w185');
  const year = result.releaseDate
    ? new Date(result.releaseDate).getFullYear()
    : null;

  async function handleImport() {
    setIsImporting(true);
    setError(null);
    try {
      await importMedia({ tmdbId: result.tmdbId, type: result.type });
      setImported(true);
      onImported?.(result.tmdbId, result.type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <article className="flex gap-4 rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="h-36 w-24 shrink-0 overflow-hidden rounded-md bg-[var(--overlay)] sm:h-40 sm:w-28">
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
            No poster
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {result.title}
          </h3>
          <span className="text-xs uppercase tracking-wide text-muted">
            {result.type === 'MOVIE' ? 'Movie' : 'Series'}
            {year ? ` · ${year}` : ''}
          </span>
        </div>
        {result.overview ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted">
            {result.overview}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
          {imported ? (
            <span className="text-sm font-medium text-accent">In library</span>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={isImporting}
              onClick={() => void handleImport()}
            >
              {isImporting ? 'Importing…' : 'Add to library'}
            </Button>
          )}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </div>
    </article>
  );
}

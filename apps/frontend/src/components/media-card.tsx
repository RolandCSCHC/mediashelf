'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { MediaItem, MediaType } from '@mediashelf/shared-types';
import { MediaItemControls } from '@/components/media-item-controls';
import { formatMediaStatus } from '@/lib/media-status';
import { formatSeriesProgress } from '@/lib/media-filters';
import type { MediaViewMode } from '@/lib/media-view-mode';
import { tmdbPosterUrl } from '@/lib/tmdb-images';

type MediaCardProps = {
  item: MediaItem;
  variant?: MediaViewMode;
  progressSeason?: number | null;
  progressEpisode?: number | null;
  actions?: ReactNode;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
  onError?: (message: string) => void;
};

export function MediaCard({
  item,
  variant = 'grid',
  progressSeason = null,
  progressEpisode = null,
  actions,
  onUpdated,
  onDeleted,
  onError,
}: MediaCardProps) {
  const poster = tmdbPosterUrl(
    item.posterPath,
    variant === 'list' ? 'w185' : 'w500',
  );
  const year = item.releaseDate
    ? new Date(item.releaseDate).getFullYear()
    : null;
  const progress =
    item.type === 'SERIES'
      ? formatSeriesProgress(progressSeason, progressEpisode)
      : null;
  const meta = (
    <>
      <TypeLabel type={item.type} />
      {year ? ` · ${year}` : ''}
      {` · ${formatMediaStatus(item.status)}`}
      {progress ? ` · ${progress}` : ''}
      {item.downloaded ? ' · Downloaded' : ''}
    </>
  );

  if (variant === 'list') {
    return (
      <article className="overflow-hidden rounded-lg border border-border bg-surface transition hover:border-accent/40">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href={`/library/${item.id}`}
            className="group flex min-w-0 flex-1 items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-[var(--overlay)]">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-tight text-muted">
                  No poster
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-accent">
                {item.title}
              </h3>
              <p className="text-xs text-muted">{meta}</p>
            </div>
          </Link>

          <div className="flex flex-col gap-2 sm:items-end">
            <MediaItemControls
              item={item}
              layout="inline"
              onUpdated={onUpdated}
              onDeleted={onDeleted}
              onError={onError}
            />
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface transition hover:border-accent/40">
      <Link
        href={`/library/${item.id}`}
        className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        <div className="aspect-[2/3] bg-[var(--overlay)]">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-sm text-muted">
              No poster
            </div>
          )}
        </div>
        <div className="space-y-1 p-3 pb-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-accent">
            {item.title}
          </h3>
          <p className="text-xs text-muted">{meta}</p>
        </div>
      </Link>

      <div className="border-t border-border px-3 py-2.5">
        <MediaItemControls
          item={item}
          layout="compact"
          onUpdated={onUpdated}
          onDeleted={onDeleted}
          onError={onError}
        />
        {actions ? <div className="mt-2 space-y-2">{actions}</div> : null}
      </div>
    </article>
  );
}

function TypeLabel({ type }: { type: MediaType }) {
  return <>{type === 'MOVIE' ? 'Movie' : 'Series'}</>;
}

'use client';

import type { MediaItem, MediaType } from '@mediashelf/shared-types';
import { tmdbPosterUrl } from '@/lib/tmdb-images';

type MediaCardProps = {
  item: MediaItem;
};

export function MediaCard({ item }: MediaCardProps) {
  const poster = tmdbPosterUrl(item.posterPath);
  const year = item.releaseDate
    ? new Date(item.releaseDate).getFullYear()
    : null;

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-surface transition hover:border-accent/40">
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
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
          {item.title}
        </h3>
        <p className="text-xs text-muted">
          <TypeLabel type={item.type} />
          {year ? ` · ${year}` : ''}
          {` · ${formatStatus(item.status)}`}
        </p>
      </div>
    </article>
  );
}

function TypeLabel({ type }: { type: MediaType }) {
  return <>{type === 'MOVIE' ? 'Movie' : 'Series'}</>;
}

function formatStatus(status: MediaItem['status']): string {
  switch (status) {
    case 'WATCHLIST':
      return 'Watchlist';
    case 'WATCHING':
      return 'Watching';
    case 'WATCHED':
      return 'Watched';
    case 'FUTURE':
      return 'Future';
    default:
      return status;
  }
}

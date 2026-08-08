'use client';

import Link from 'next/link';
import type { MediaItem, MediaType } from '@mediashelf/shared-types';
import { MediaItemControls } from '@/components/media-item-controls';
import { formatMediaStatus } from '@/lib/media-status';
import { tmdbPosterUrl } from '@/lib/tmdb-images';

type MediaCardProps = {
  item: MediaItem;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
  onError?: (message: string) => void;
};

export function MediaCard({
  item,
  onUpdated,
  onDeleted,
  onError,
}: MediaCardProps) {
  const poster = tmdbPosterUrl(item.posterPath);
  const year = item.releaseDate
    ? new Date(item.releaseDate).getFullYear()
    : null;

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
          <p className="text-xs text-muted">
            <TypeLabel type={item.type} />
            {year ? ` · ${year}` : ''}
            {` · ${formatMediaStatus(item.status)}`}
            {item.downloaded ? ' · Downloaded' : ''}
          </p>
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
      </div>
    </article>
  );
}

function TypeLabel({ type }: { type: MediaType }) {
  return <>{type === 'MOVIE' ? 'Movie' : 'Series'}</>;
}

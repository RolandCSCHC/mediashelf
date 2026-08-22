'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  type MediaItem,
  type MediaStatus,
  type MediaType,
} from '@mediashelf/shared-types';
import { MediaItemControls } from '@/components/media-item-controls';
import { ReleaseStatusBadge } from '@/components/release-status-badge';
import { useI18n } from '@/components/locale-provider';
import { mediaStatusLabelKey } from '@/lib/media-status';
import { formatSeriesProgress } from '@/lib/media-filters';
import type { MediaViewMode } from '@/lib/media-view-mode';
import { formatReleaseLabel } from '@/lib/format-date';
import { tmdbPosterUrl } from '@/lib/tmdb-images';

type MediaCardProps = {
  item: MediaItem;
  variant?: MediaViewMode;
  /** When set, the details page back link returns to this list. */
  fromListId?: string;
  /** Limit the status dropdown (list default + Watching). */
  allowedStatuses?: MediaStatus[] | null;
  /** Status in this list. When set, the card edits list membership status. */
  status?: MediaStatus;
  onStatusChange?: (status: MediaStatus) => Promise<void>;
  /** Downloaded in this list. When set, the card edits list membership. */
  downloaded?: boolean;
  onDownloadedChange?: (downloaded: boolean) => Promise<void>;
  progressSeason?: number | null;
  progressEpisode?: number | null;
  actions?: ReactNode;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
  onError?: (message: string) => void;
};

function mediaDetailHref(itemId: string, fromListId?: string): string {
  if (!fromListId) {
    return `/library/${itemId}`;
  }

  const params = new URLSearchParams({ fromList: fromListId });
  return `/library/${itemId}?${params.toString()}`;
}

export function MediaCard({
  item,
  variant = 'grid',
  fromListId,
  allowedStatuses,
  status,
  onStatusChange,
  downloaded,
  onDownloadedChange,
  progressSeason = null,
  progressEpisode = null,
  actions,
  onUpdated,
  onDeleted,
  onError,
}: MediaCardProps) {
  const { t, locale } = useI18n();
  const href = mediaDetailHref(item.id, fromListId);
  const poster = tmdbPosterUrl(
    item.posterPath,
    variant === 'list' ? 'w185' : 'w500',
  );
  const releaseLabel = formatReleaseLabel(item, locale);
  const progress =
    item.type === 'SERIES'
      ? formatSeriesProgress(progressSeason, progressEpisode)
      : null;
  const displayedStatus = status ?? item.status;
  const displayedDownloaded = downloaded ?? item.downloaded;
  const meta = (
    <>
      <TypeLabel type={item.type} />
      {releaseLabel ? ` · ${releaseLabel}` : ''}
      {` · ${t(mediaStatusLabelKey(displayedStatus))}`}
      {progress ? ` · ${progress}` : ''}
      {displayedDownloaded ? ` · ${t('common.downloaded')}` : ''}
    </>
  );

  if (variant === 'list') {
    return (
      <article className="overflow-hidden rounded-lg border border-border bg-surface transition hover:border-accent/40">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href={href}
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
                  {t('common.noPoster')}
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="min-w-0 truncate text-sm font-semibold text-foreground group-hover:text-accent">
                  {item.title}
                </h3>
                <ReleaseStatusBadge item={item} />
              </div>
              <p className="text-xs text-muted">{meta}</p>
            </div>
          </Link>

          <div className="flex flex-col gap-2 sm:items-end">
            <MediaItemControls
              item={item}
              layout="inline"
              allowedStatuses={allowedStatuses}
              status={status}
              onStatusChange={onStatusChange}
              downloaded={downloaded}
              onDownloadedChange={onDownloadedChange}
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
        href={href}
        className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        <div className="relative aspect-[2/3] bg-[var(--overlay)]">
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
              {t('common.noPoster')}
            </div>
          )}
          <ReleaseStatusBadge item={item} className="absolute right-2 top-2" />
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
          allowedStatuses={allowedStatuses}
          status={status}
          onStatusChange={onStatusChange}
          downloaded={downloaded}
          onDownloadedChange={onDownloadedChange}
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
  const { t } = useI18n();
  return <>{type === 'MOVIE' ? t('common.movie') : t('common.series')}</>;
}

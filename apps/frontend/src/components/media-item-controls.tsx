'use client';

import { useState } from 'react';
import type { MediaItem, MediaStatus } from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { deleteMedia, updateMedia } from '@/lib/api';
import { MEDIA_STATUS_OPTIONS } from '@/lib/media-status';

type MediaItemControlsProps = {
  item: MediaItem;
  layout?: 'full' | 'compact';
  disabled?: boolean;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
  onError?: (message: string) => void;
};

export function MediaItemControls({
  item,
  layout = 'full',
  disabled = false,
  onUpdated,
  onDeleted,
  onError,
}: MediaItemControlsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const busy = disabled || isSaving || isDeleting;
  const compact = layout === 'compact';

  async function handleStatusChange(status: MediaStatus) {
    if (status === item.status) {
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateMedia(item.id, { status });
      onUpdated(updated);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadedToggle() {
    setIsSaving(true);
    try {
      const updated = await updateMedia(item.id, {
        downloaded: !item.downloaded,
      });
      onUpdated(updated);
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : 'Failed to update downloaded',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Remove “${item.title}” from your library?`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMedia(item.id);
      onDeleted(item.id);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
    }
  }

  const selectClass = compact
    ? 'w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60'
    : 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60';

  return (
    <div className={compact ? 'space-y-2' : 'space-y-6'}>
      <div className={compact ? 'space-y-2' : 'grid gap-6 sm:grid-cols-2'}>
        <label className="block space-y-1.5">
          {!compact ? (
            <span className="text-sm font-medium text-foreground">Status</span>
          ) : (
            <span className="sr-only">Status</span>
          )}
          <select
            value={item.status}
            disabled={busy}
            aria-label="Status"
            onChange={(event) =>
              void handleStatusChange(event.target.value as MediaStatus)
            }
            className={selectClass}
          >
            {MEDIA_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label
          className={
            compact ? 'flex items-center gap-2' : 'flex items-end gap-3 pb-2'
          }
        >
          <input
            type="checkbox"
            checked={item.downloaded}
            disabled={busy}
            onChange={() => void handleDownloadedToggle()}
            className="h-4 w-4 rounded border-border accent-[var(--accent)]"
          />
          <span
            className={
              compact
                ? 'text-xs font-medium text-foreground'
                : 'text-sm font-medium text-foreground'
            }
          >
            Downloaded
          </span>
        </label>
      </div>

      {!compact && item.status === 'WATCHED' && item.dateWatched ? (
        <p className="text-sm text-muted">
          Watched on{' '}
          {new Date(item.dateWatched).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      ) : null}

      {!compact ? (
        <div className="pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void handleDelete()}
            className="border-danger/40 text-danger hover:bg-danger/10"
          >
            {isDeleting ? 'Removing…' : 'Remove from library'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

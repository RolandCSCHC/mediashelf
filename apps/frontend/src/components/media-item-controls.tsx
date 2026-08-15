'use client';

import { useEffect, useState } from 'react';
import type { MediaItem, MediaStatus } from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { deleteMedia, updateMedia } from '@/lib/api';
import { MEDIA_STATUS_OPTIONS } from '@/lib/media-status';

type MediaItemControlsProps = {
  item: MediaItem;
  layout?: 'full' | 'compact' | 'inline';
  disabled?: boolean;
  allowedStatuses?: MediaStatus[] | null;
  /** Status shown in the dropdown. Defaults to the library title status. */
  status?: MediaStatus;
  /** When set, status changes go here instead of PATCH /media/:id. */
  onStatusChange?: (status: MediaStatus) => Promise<void>;
  /** Downloaded flag shown in the checkbox. Defaults to the library title. */
  downloaded?: boolean;
  /** When set, downloaded changes go here instead of PATCH /media/:id. */
  onDownloadedChange?: (downloaded: boolean) => Promise<void>;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
  onError?: (message: string) => void;
};

export function MediaItemControls({
  item,
  layout = 'full',
  disabled = false,
  allowedStatuses,
  status,
  onStatusChange,
  downloaded,
  onDownloadedChange,
  onUpdated,
  onDeleted,
  onError,
}: MediaItemControlsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.notes ?? '');
  const busy = disabled || isSaving || isDeleting;
  const compact = layout === 'compact' || layout === 'inline';
  const inline = layout === 'inline';
  const displayedStatus = status ?? item.status;
  const displayedDownloaded = downloaded ?? item.downloaded;
  const statusOptions = MEDIA_STATUS_OPTIONS.filter((option) => {
    if (!allowedStatuses) {
      return true;
    }
    return (
      allowedStatuses.includes(option.value) || option.value === displayedStatus
    );
  });

  useEffect(() => {
    setNotesDraft(item.notes ?? '');
  }, [item.id, item.notes]);

  async function handleStatusChange(nextStatus: MediaStatus) {
    if (nextStatus === displayedStatus) {
      return;
    }
    setIsSaving(true);
    try {
      if (onStatusChange) {
        await onStatusChange(nextStatus);
      } else {
        const updated = await updateMedia(item.id, { status: nextStatus });
        onUpdated(updated);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadedToggle() {
    const nextDownloaded = !displayedDownloaded;
    setIsSaving(true);
    try {
      if (onDownloadedChange) {
        await onDownloadedChange(nextDownloaded);
      } else {
        const updated = await updateMedia(item.id, {
          downloaded: nextDownloaded,
        });
        onUpdated(updated);
      }
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : 'Failed to update downloaded',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNotesSave() {
    const nextNotes = notesDraft.trim() || null;
    if (nextNotes === (item.notes ?? null)) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateMedia(item.id, { notes: nextNotes });
      onUpdated(updated);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to update notes');
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
    ? inline
      ? 'min-w-[7.5rem] rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60'
      : 'w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60'
    : 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60';

  return (
    <div className={compact ? (inline ? '' : 'space-y-2') : 'space-y-6'}>
      <div
        className={
          inline
            ? 'flex flex-wrap items-center gap-3'
            : compact
              ? 'space-y-2'
              : 'grid gap-6 sm:grid-cols-2'
        }
      >
        <label className={inline ? 'block' : 'block space-y-1.5'}>
          {!compact ? (
            <span className="text-sm font-medium text-foreground">Status</span>
          ) : (
            <span className="sr-only">Status</span>
          )}
          <select
            value={displayedStatus}
            disabled={busy}
            aria-label="Status"
            onChange={(event) =>
              void handleStatusChange(event.target.value as MediaStatus)
            }
            className={selectClass}
          >
            {statusOptions.map((option) => (
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
            checked={displayedDownloaded}
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

      {!compact ? (
        <div className="space-y-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Notes</span>
            <textarea
              value={notesDraft}
              disabled={busy}
              rows={3}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="Links, season ranges, or anything else"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60"
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={
              busy || (notesDraft.trim() || null) === (item.notes ?? null)
            }
            onClick={() => void handleNotesSave()}
          >
            Save notes
          </Button>
        </div>
      ) : null}

      {!compact && displayedStatus === 'WATCHED' && item.dateWatched ? (
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

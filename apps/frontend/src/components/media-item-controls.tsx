'use client';

import { useEffect, useState } from 'react';
import type { MediaItem, MediaStatus } from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/locale-provider';
import { dateLocale } from '@/i18n';
import { deleteMedia, updateMedia } from '@/lib/api';
import { MEDIA_STATUS_OPTIONS } from '@/lib/media-status';

type MediaItemControlsProps = {
  item: MediaItem;
  layout?: 'full' | 'compact' | 'inline';
  disabled?: boolean;
  allowedStatuses?: MediaStatus[] | null;
  /** Status in this list. Required to show the status dropdown. */
  status?: MediaStatus;
  /** Status changes go here (list membership PATCH). */
  onStatusChange?: (status: MediaStatus) => Promise<void>;
  /** Downloaded in this list. Required to show the checkbox. */
  downloaded?: boolean;
  /** Downloaded changes go here (list membership PATCH). */
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
  const { t, locale } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.notes ?? '');
  const busy = disabled || isSaving || isDeleting;
  const compact = layout === 'compact' || layout === 'inline';
  const inline = layout === 'inline';
  const showStatusControls =
    status !== undefined && onStatusChange !== undefined;
  const showDownloadedControls =
    downloaded !== undefined && onDownloadedChange !== undefined;
  const displayedStatus = status;
  const displayedDownloaded = downloaded ?? false;
  const statusOptions = MEDIA_STATUS_OPTIONS.filter((option) => {
    if (!displayedStatus || !allowedStatuses) {
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
    if (!onStatusChange || nextStatus === displayedStatus) {
      return;
    }
    setIsSaving(true);
    try {
      await onStatusChange(nextStatus);
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : t('media.updateStatusFailed'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadedToggle() {
    if (!onDownloadedChange) {
      return;
    }
    const nextDownloaded = !displayedDownloaded;
    setIsSaving(true);
    try {
      await onDownloadedChange(nextDownloaded);
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : t('media.updateDownloadedFailed'),
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
      onError?.(
        err instanceof Error ? err.message : t('media.updateNotesFailed'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      t('media.removeConfirm', { title: item.title }),
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMedia(item.id);
      onDeleted(item.id);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : t('media.deleteFailed'));
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
      {showStatusControls || showDownloadedControls ? (
        <div
          className={
            inline
              ? 'flex flex-wrap items-center gap-3'
              : compact
                ? 'space-y-2'
                : 'grid gap-6 sm:grid-cols-2'
          }
        >
          {showStatusControls && displayedStatus ? (
            <label className={inline ? 'block' : 'block space-y-1.5'}>
              {!compact ? (
                <span className="text-sm font-medium text-foreground">
                  {t('filters.status')}
                </span>
              ) : (
                <span className="sr-only">{t('filters.status')}</span>
              )}
              <select
                value={displayedStatus}
                disabled={busy}
                aria-label={t('filters.status')}
                onChange={(event) =>
                  void handleStatusChange(event.target.value as MediaStatus)
                }
                className={selectClass}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showDownloadedControls ? (
            <label
              className={
                compact
                  ? 'flex items-center gap-2'
                  : 'flex items-end gap-3 pb-2'
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
                {t('common.downloaded')}
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

      {!compact ? (
        <div className="space-y-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              {t('common.notes')}
            </span>
            <textarea
              value={notesDraft}
              disabled={busy}
              rows={3}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder={t('media.notesPlaceholder')}
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
            {t('media.saveNotes')}
          </Button>
        </div>
      ) : null}

      {!compact && item.dateWatched ? (
        <p className="text-sm text-muted">
          {t('media.watchedOn', {
            date: new Date(item.dateWatched).toLocaleDateString(
              dateLocale(locale),
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              },
            ),
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
            {isDeleting ? t('media.removing') : t('media.removeFromLibrary')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

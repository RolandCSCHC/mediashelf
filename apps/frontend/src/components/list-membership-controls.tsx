'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  CustomList,
  CustomListEntry,
  MediaItem,
  MediaListMembership,
  MediaStatus,
} from '@mediashelf/shared-types';
import { allowedStatusesForList, MediaType } from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { SeriesProgressControls } from '@/components/series-progress-controls';
import { useI18n } from '@/components/locale-provider';
import {
  addMediaToList,
  getMedia,
  listCustomLists,
  listMediaMemberships,
  moveMediaBetweenLists,
  updateListItem,
} from '@/lib/api';
import { formatSeriesProgress } from '@/lib/media-filters';
import { MEDIA_STATUS_OPTIONS } from '@/lib/media-status';

type ListMembershipControlsProps = {
  mediaItem: MediaItem;
  onMediaUpdated?: (item: MediaItem) => void;
  onError?: (message: string) => void;
};

export function ListMembershipControls({
  mediaItem,
  onMediaUpdated,
  onError,
}: ListMembershipControlsProps) {
  const { t } = useI18n();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [memberships, setMemberships] = useState<MediaListMembership[]>([]);
  const [listId, setListId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [moveFrom, setMoveFrom] = useState<MediaListMembership | null>(null);
  const [moveTargetListId, setMoveTargetListId] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const isSeries = mediaItem.type === MediaType.SERIES;

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true);
      }
      try {
        const [customLists, mediaMemberships] = await Promise.all([
          listCustomLists(),
          listMediaMemberships(mediaItem.id),
        ]);
        setLists(customLists);
        setMemberships(mediaMemberships);

        const memberIds = new Set(
          mediaMemberships.map((entry) => entry.listId),
        );
        const available = customLists.find((list) => !memberIds.has(list.id));
        setListId(available?.id ?? '');
      } catch (err) {
        onError?.(err instanceof Error ? err.message : t('lists.loadFailed'));
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [mediaItem.id, onError, t],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd() {
    if (!listId) {
      onError?.(t('membership.createFirst'));
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      await addMediaToList(listId, { mediaItemId: mediaItem.id });
      setMessage(t('membership.added'));
      await load({ silent: true });
      if (onMediaUpdated) {
        const updated = await getMedia(mediaItem.id);
        onMediaUpdated(updated);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : t('membership.addFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  function openMove(membership: MediaListMembership) {
    const destinations = lists.filter(
      (list) => !memberships.some((entry) => entry.listId === list.id),
    );
    if (destinations.length === 0) {
      return;
    }

    setMoveFrom(membership);
    setMoveTargetListId(destinations[0]?.id ?? '');
    setMessage(null);
  }

  function closeMove() {
    if (isMoving) {
      return;
    }
    setMoveFrom(null);
    setMoveTargetListId('');
  }

  async function handleMove() {
    if (!moveFrom || !moveTargetListId) {
      onError?.(t('membership.chooseDestination'));
      return;
    }

    setIsMoving(true);
    setMessage(null);
    try {
      await moveMediaBetweenLists(moveFrom.listId, mediaItem.id, {
        targetListId: moveTargetListId,
      });
      setMoveFrom(null);
      setMoveTargetListId('');
      setMessage(t('membership.moved'));
      await load({ silent: true });
      if (onMediaUpdated) {
        const updated = await getMedia(mediaItem.id);
        onMediaUpdated(updated);
      }
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : t('membership.moveFailed'),
      );
    } finally {
      setIsMoving(false);
    }
  }

  async function handleMembershipStatusChange(
    listId: string,
    nextStatus: MediaStatus,
  ) {
    try {
      const updated = await updateListItem(listId, mediaItem.id, {
        status: nextStatus,
      });
      setMemberships((prev) => applyListItemUpdate(prev, listId, updated));
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : t('membership.updateStatusFailed'),
      );
    }
  }

  async function handleMembershipDownloadedChange(
    listId: string,
    nextDownloaded: boolean,
  ) {
    try {
      const updated = await updateListItem(listId, mediaItem.id, {
        downloaded: nextDownloaded,
      });
      setMemberships((prev) => applyListItemUpdate(prev, listId, updated));
    } catch (err) {
      onError?.(
        err instanceof Error
          ? err.message
          : t('membership.updateDownloadedFailed'),
      );
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">{t('lists.loading')}</p>;
  }

  const memberIds = new Set(memberships.map((entry) => entry.listId));
  const availableLists = lists.filter((list) => !memberIds.has(list.id));
  const statusSelectClass =
    'rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60';

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          {t('membership.lists')}
        </p>

        {memberships.length === 0 ? (
          <p className="text-sm text-muted">{t('membership.notInLists')}</p>
        ) : (
          <ul className="space-y-4">
            {memberships.map((membership) => {
              const progress = isSeries
                ? formatSeriesProgress(
                    membership.currentSeason,
                    membership.currentEpisode,
                  )
                : null;
              const list = lists.find(
                (entry) => entry.id === membership.listId,
              );
              const allowedStatuses = allowedStatusesForList(
                list?.defaultStatus ?? null,
              );
              const statusOptions = MEDIA_STATUS_OPTIONS.filter((option) => {
                if (!allowedStatuses) {
                  return true;
                }
                return (
                  allowedStatuses.includes(option.value) ||
                  option.value === membership.status
                );
              });

              return (
                <li
                  key={membership.listId}
                  className="space-y-3 border-t border-border/70 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/lists/${membership.listId}`}
                        className="font-medium text-foreground transition hover:text-accent"
                      >
                        {membership.listName}
                      </Link>
                      {progress ? (
                        <span className="ml-2 text-xs text-muted">
                          {progress}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <label
                        className="sr-only"
                        htmlFor={`list-status-${membership.listId}`}
                      >
                        {t('membership.statusIn', {
                          name: membership.listName,
                        })}
                      </label>
                      <select
                        id={`list-status-${membership.listId}`}
                        value={membership.status}
                        disabled={isSaving || isMoving}
                        aria-label={t('membership.statusIn', {
                          name: membership.listName,
                        })}
                        onChange={(event) =>
                          void handleMembershipStatusChange(
                            membership.listId,
                            event.target.value as MediaStatus,
                          )
                        }
                        className={statusSelectClass}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </option>
                        ))}
                      </select>
                      <label
                        className="flex items-center gap-2"
                        htmlFor={`list-downloaded-${membership.listId}`}
                      >
                        <input
                          id={`list-downloaded-${membership.listId}`}
                          type="checkbox"
                          checked={membership.downloaded}
                          disabled={isSaving || isMoving}
                          aria-label={t('membership.downloadedIn', {
                            name: membership.listName,
                          })}
                          onChange={() =>
                            void handleMembershipDownloadedChange(
                              membership.listId,
                              !membership.downloaded,
                            )
                          }
                          className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                        />
                        <span className="text-xs font-medium text-foreground">
                          {t('common.downloaded')}
                        </span>
                      </label>
                      {availableLists.length > 0 ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="shrink-0"
                          aria-label={t('membership.moveFromAria', {
                            name: membership.listName,
                          })}
                          disabled={isSaving || isMoving}
                          onClick={() => openMove(membership)}
                        >
                          {t('membership.move')}
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {isSeries ? (
                    <SeriesProgressControls
                      currentSeason={membership.currentSeason}
                      currentEpisode={membership.currentEpisode}
                      compact
                      onSave={async (progressUpdate) => {
                        const updated = await updateListItem(
                          membership.listId,
                          mediaItem.id,
                          progressUpdate,
                        );
                        setMemberships((prev) =>
                          applyListItemUpdate(prev, membership.listId, updated),
                        );
                      }}
                      onError={onError}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {lists.length === 0 ? (
        <p className="text-sm text-muted">
          {t('membership.noListsYet')}{' '}
          <Link
            href="/lists"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('membership.createOne')}
          </Link>
        </p>
      ) : availableLists.length === 0 ? (
        <p className="text-sm text-muted">{t('membership.alreadyInEvery')}</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {t('membership.addToList')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={listId}
              disabled={isSaving}
              onChange={(event) => setListId(event.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60 sm:min-w-[12rem]"
              aria-label={t('membership.customListAria')}
            >
              {availableLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSaving || !listId}
              onClick={() => void handleAdd()}
            >
              {isSaving ? t('membership.adding') : t('membership.add')}
            </Button>
          </div>
        </div>
      )}

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <Modal
        open={moveFrom !== null}
        title={t('membership.moveTitle')}
        onClose={closeMove}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {t('membership.moveFrom')}{' '}
            <span className="font-medium text-foreground">
              {moveFrom?.listName}
            </span>
          </p>
          <div className="space-y-2">
            <label
              htmlFor="move-target-list"
              className="text-sm font-medium text-foreground"
            >
              {t('membership.destination')}
            </label>
            <select
              id="move-target-list"
              value={moveTargetListId}
              disabled={isMoving}
              onChange={(event) => setMoveTargetListId(event.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60"
            >
              {availableLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isMoving}
              onClick={closeMove}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isMoving || !moveTargetListId}
              onClick={() => void handleMove()}
            >
              {isMoving ? t('membership.moving') : t('membership.move')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function applyListItemUpdate(
  prev: MediaListMembership[],
  listId: string,
  updated: CustomListEntry,
): MediaListMembership[] {
  return prev.map((entry) =>
    entry.listId === listId
      ? {
          ...entry,
          status: updated.status,
          downloaded: updated.downloaded,
          currentSeason: updated.currentSeason,
          currentEpisode: updated.currentEpisode,
        }
      : entry,
  );
}

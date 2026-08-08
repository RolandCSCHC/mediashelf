'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  CustomList,
  MediaItem,
  MediaListMembership,
} from '@mediashelf/shared-types';
import { MediaType } from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { SeriesProgressControls } from '@/components/series-progress-controls';
import {
  addMediaToList,
  listCustomLists,
  listMediaMemberships,
  updateListItem,
} from '@/lib/api';
import { formatSeriesProgress } from '@/lib/media-filters';

type ListMembershipControlsProps = {
  mediaItem: MediaItem;
  onError?: (message: string) => void;
};

export function ListMembershipControls({
  mediaItem,
  onError,
}: ListMembershipControlsProps) {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [memberships, setMemberships] = useState<MediaListMembership[]>([]);
  const [listId, setListId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isSeries = mediaItem.type === MediaType.SERIES;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [customLists, mediaMemberships] = await Promise.all([
        listCustomLists(),
        listMediaMemberships(mediaItem.id),
      ]);
      setLists(customLists);
      setMemberships(mediaMemberships);

      const memberIds = new Set(mediaMemberships.map((entry) => entry.listId));
      const available = customLists.find((list) => !memberIds.has(list.id));
      setListId(available?.id ?? '');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to load lists');
    } finally {
      setIsLoading(false);
    }
  }, [mediaItem.id, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd() {
    if (!listId) {
      onError?.('Create a list first');
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      await addMediaToList(listId, { mediaItemId: mediaItem.id });
      setMessage('Added to list');
      await load();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to add to list');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading lists…</p>;
  }

  const memberIds = new Set(memberships.map((entry) => entry.listId));
  const availableLists = lists.filter((list) => !memberIds.has(list.id));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Lists</p>

        {memberships.length === 0 ? (
          <p className="text-sm text-muted">Not in any custom lists yet.</p>
        ) : (
          <ul className="space-y-4">
            {memberships.map((membership) => {
              const progress = isSeries
                ? formatSeriesProgress(
                    membership.currentSeason,
                    membership.currentEpisode,
                  )
                : null;

              return (
                <li
                  key={membership.listId}
                  className="space-y-3 border-t border-border/70 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/lists/${membership.listId}`}
                      className="font-medium text-foreground transition hover:text-accent"
                    >
                      {membership.listName}
                    </Link>
                    {progress ? (
                      <span className="text-xs text-muted">{progress}</span>
                    ) : null}
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
                          prev.map((entry) =>
                            entry.listId === membership.listId
                              ? {
                                  ...entry,
                                  currentSeason: updated.currentSeason,
                                  currentEpisode: updated.currentEpisode,
                                }
                              : entry,
                          ),
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
          No custom lists yet.{' '}
          <Link
            href="/lists"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      ) : availableLists.length === 0 ? (
        <p className="text-sm text-muted">
          This title is already in every list.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Add to list</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={listId}
              disabled={isSaving}
              onChange={(event) => setListId(event.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60 sm:min-w-[12rem]"
              aria-label="Custom list"
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
              {isSaving ? 'Adding…' : 'Add'}
            </Button>
          </div>
          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CustomListDetail, MediaItem } from '@mediashelf/shared-types';
import { MediaType } from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { addMediaItemsToList, listMedia } from '@/lib/api';
import { tmdbPosterUrl } from '@/lib/tmdb-images';

type TypeFilter = '' | MediaType;

type AddLibraryToListModalProps = {
  open: boolean;
  listId: string;
  existingMediaItemIds: ReadonlySet<string>;
  onClose: () => void;
  onAdded: (detail: CustomListDetail) => void;
  onError?: (message: string) => void;
};

export function AddLibraryToListModal({
  open,
  listId,
  existingMediaItemIds,
  onClose,
  onAdded,
  onError,
}: AddLibraryToListModalProps) {
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearch('');
    setTypeFilter('');
    setSelectedIds(new Set());
    setLoadError(null);
    setIsLoading(true);

    void listMedia()
      .then((items) => {
        setLibrary(items);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : 'Failed to load library';
        setLoadError(message);
        onError?.(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, onError]);

  const availableItems = useMemo(
    () => library.filter((item) => !existingMediaItemIds.has(item.id)),
    [library, existingMediaItemIds],
  );

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return availableItems.filter((item) => {
      if (typeFilter && item.type !== typeFilter) {
        return false;
      }
      if (query && !item.title.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [availableItems, search, typeFilter]);

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selectedIds.has(item.id));

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of visibleItems) {
        next.add(item.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleClose() {
    if (isSaving) {
      return;
    }
    onClose();
  }

  async function handleAdd() {
    if (selectedCount === 0) {
      return;
    }

    setIsSaving(true);
    try {
      const detail = await addMediaItemsToList(listId, {
        mediaItemIds: Array.from(selectedIds),
      });
      onAdded(detail);
      onClose();
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : 'Failed to add titles to list',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2';

  return (
    <Modal open={open} title="Add from library" size="lg" onClose={handleClose}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles…"
            className={fieldClass}
            disabled={isLoading || isSaving}
            data-autofocus
          />
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as TypeFilter)
            }
            className={`${fieldClass} sm:w-40`}
            disabled={isLoading || isSaving}
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            <option value={MediaType.MOVIE}>Movies</option>
            <option value={MediaType.SERIES}>Series</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {isLoading
              ? 'Loading library…'
              : `${visibleItems.length} available${
                  selectedCount > 0 ? ` · ${selectedCount} selected` : ''
                }`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                isLoading ||
                isSaving ||
                visibleItems.length === 0 ||
                allVisibleSelected
              }
              onClick={selectAllVisible}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading || isSaving || selectedCount === 0}
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        </div>

        {loadError ? (
          <p className="text-sm text-danger" role="alert">
            {loadError}
          </p>
        ) : null}

        <div className="max-h-[min(24rem,50vh)] overflow-y-auto rounded-md border border-border">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted">Loading…</p>
          ) : availableItems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Everything in your library is already on this list.
            </p>
          ) : visibleItems.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No titles match your search.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {visibleItems.map((item) => {
                const poster = tmdbPosterUrl(item.posterPath, 'w185');
                const year = item.releaseDate
                  ? new Date(item.releaseDate).getFullYear()
                  : null;
                const checked = selectedIds.has(item.id);

                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 transition hover:bg-[var(--overlay)]">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isSaving}
                        onChange={() => toggleItem(item.id)}
                        className="size-4 shrink-0 accent-[var(--accent)]"
                      />
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-[var(--overlay)]">
                        {poster ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={poster}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted">
                          {item.type === MediaType.MOVIE ? 'Movie' : 'Series'}
                          {year ? ` · ${year}` : ''}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSaving}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving || selectedCount === 0}
            onClick={() => void handleAdd()}
          >
            {isSaving
              ? 'Adding…'
              : selectedCount === 0
                ? 'Add titles'
                : selectedCount === 1
                  ? 'Add 1 title'
                  : `Add ${selectedCount} titles`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

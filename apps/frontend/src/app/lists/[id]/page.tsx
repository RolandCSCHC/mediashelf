'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type {
  CustomListDetail,
  CustomListEntry,
  MediaItem,
} from '@mediashelf/shared-types';
import { MediaType } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { AddLibraryToListModal } from '@/components/add-library-to-list-modal';
import {
  DEFAULT_LIBRARY_FILTERS,
  LibraryFilterSortControls,
  type LibraryFiltersState,
} from '@/components/library-filters';
import { MediaCard } from '@/components/media-card';
import { SeriesProgressControls } from '@/components/series-progress-controls';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  deleteCustomList,
  getCustomList,
  removeMediaFromList,
  updateCustomList,
  updateListItem,
} from '@/lib/api';
import { compareMediaItems, matchesMediaFilters } from '@/lib/media-filters';

function ListDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [list, setList] = useState<CustomListDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<LibraryFiltersState>(
    DEFAULT_LIBRARY_FILTERS,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await getCustomList(id);
      setList(detail);
      setName(detail.name);
      setDescription(detail.description ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load list');
      setList(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEditModal() {
    if (!list) {
      return;
    }
    setName(list.name);
    setDescription(list.description ?? '');
    setFormError(null);
    setIsEditOpen(true);
  }

  function closeEditModal() {
    if (isSaving) {
      return;
    }
    setIsEditOpen(false);
    setFormError(null);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!list) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('List name is required');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const updated = await updateCustomList(list.id, {
        name: trimmedName,
        description: description.trim() || null,
      });
      setList((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              description: updated.description,
              updatedAt: updated.updatedAt,
            }
          : prev,
      );
      setIsEditOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to update list',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteList() {
    if (!list) {
      return;
    }
    const confirmed = window.confirm(`Delete list “${list.name}”?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomList(list.id);
      router.push('/lists');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to delete list',
      );
    }
  }

  function handleUpdated(updated: MediaItem) {
    setActionError(null);
    setList((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((entry) =>
              entry.mediaItemId === updated.id
                ? { ...entry, mediaItem: updated }
                : entry,
            ),
          }
        : prev,
    );
  }

  async function handleDeleted(mediaItemId: string) {
    setActionError(null);
    setList((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter(
              (entry) => entry.mediaItemId !== mediaItemId,
            ),
            itemCount: Math.max(0, prev.itemCount - 1),
          }
        : prev,
    );
  }

  async function handleRemoveFromList(mediaItemId: string) {
    if (!list) {
      return;
    }
    try {
      await removeMediaFromList(list.id, mediaItemId);
      setList((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter(
                (entry) => entry.mediaItemId !== mediaItemId,
              ),
              itemCount: Math.max(0, prev.itemCount - 1),
            }
          : prev,
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to remove from list',
      );
    }
  }

  function handleProgressUpdated(updated: CustomListEntry) {
    setList((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((entry) =>
              entry.mediaItemId === updated.mediaItemId ? updated : entry,
            ),
          }
        : prev,
    );
  }

  function resetFiltersOnly() {
    setFilters((prev) => ({
      ...DEFAULT_LIBRARY_FILTERS,
      sortBy: prev.sortBy,
    }));
  }

  const genres = useMemo(() => {
    if (!list) {
      return [];
    }
    return Array.from(
      new Set(list.items.flatMap((entry) => entry.mediaItem.genres)),
    ).sort((a, b) => a.localeCompare(b));
  }, [list]);

  const existingMediaItemIds = useMemo(() => {
    if (!list) {
      return new Set<string>();
    }
    return new Set(list.items.map((entry) => entry.mediaItemId));
  }, [list]);

  const visibleItems = useMemo(() => {
    if (!list) {
      return [];
    }

    return list.items
      .filter((entry) => matchesMediaFilters(entry.mediaItem, filters))
      .sort((a, b) =>
        compareMediaItems(a.mediaItem, b.mediaItem, filters.sortBy),
      );
  }, [list, filters]);

  const hasActiveFilters =
    filters.status !== '' ||
    filters.type !== '' ||
    filters.genre !== '' ||
    filters.downloaded !== '' ||
    filters.search.trim() !== '';

  const fieldClass =
    'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2';

  return (
    <AppShell width="wide">
      <Link
        href="/lists"
        className="text-sm text-muted transition hover:text-foreground"
      >
        ← Back to lists
      </Link>

      {isLoading ? <p className="mt-10 text-sm text-muted">Loading…</p> : null}

      {error && !list ? (
        <p className="mt-10 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {list ? (
        <>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {list.name}
              </h1>
              {list.description ? (
                <p className="mt-2 text-sm text-muted">{list.description}</p>
              ) : null}
              <p className="mt-2 text-sm text-muted">
                {list.itemCount} {list.itemCount === 1 ? 'title' : 'titles'}
                {hasActiveFilters ? ` · showing ${visibleItems.length}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LibraryFilterSortControls
                value={filters}
                genres={genres}
                showListFilter={false}
                onChange={setFilters}
                onResetFilters={resetFiltersOnly}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setIsAddOpen(true);
                }}
              >
                Add from library
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openEditModal}
              >
                Edit list
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10"
                onClick={() => void handleDeleteList()}
              >
                Delete list
              </Button>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted">Filters are active</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFiltersOnly}
              >
                Clear filters
              </Button>
            </div>
          ) : null}

          {actionError ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              {actionError}
            </p>
          ) : null}

          {list.items.length === 0 ? (
            <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
              <p className="font-display text-xl text-foreground">
                This list is empty
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                Add titles from your library to get started.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setActionError(null);
                  setIsAddOpen(true);
                }}
              >
                Add from library
              </Button>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
              <p className="font-display text-xl text-foreground">
                No titles match
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                Try clearing filters to see everything in this list.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                onClick={resetFiltersOnly}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visibleItems.map((entry) => (
                <div key={entry.mediaItemId} className="space-y-2">
                  <MediaCard
                    item={entry.mediaItem}
                    progressSeason={entry.currentSeason}
                    progressEpisode={entry.currentEpisode}
                    onUpdated={handleUpdated}
                    onDeleted={(mediaId) => void handleDeleted(mediaId)}
                    onError={setActionError}
                  />
                  {entry.mediaItem.type === MediaType.SERIES ? (
                    <SeriesProgressControls
                      currentSeason={entry.currentSeason}
                      currentEpisode={entry.currentEpisode}
                      compact
                      onSave={async (progress) => {
                        const updated = await updateListItem(
                          list.id,
                          entry.mediaItemId,
                          progress,
                        );
                        handleProgressUpdated(updated);
                      }}
                      onError={setActionError}
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => void handleRemoveFromList(entry.mediaItemId)}
                  >
                    Remove from list
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Modal open={isEditOpen} title="Edit list" onClose={closeEditModal}>
            <form
              onSubmit={(event) => void handleSave(event)}
              className="space-y-4"
            >
              <label className="block space-y-1.5">
                <span className="text-xs uppercase tracking-wide text-muted">
                  Name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={fieldClass}
                  maxLength={80}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs uppercase tracking-wide text-muted">
                  Description
                </span>
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={fieldClass}
                  placeholder="Optional"
                  maxLength={280}
                />
              </label>

              {formError ? (
                <p className="text-sm text-danger" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                  onClick={closeEditModal}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Modal>

          <AddLibraryToListModal
            open={isAddOpen}
            listId={list.id}
            existingMediaItemIds={existingMediaItemIds}
            onClose={() => setIsAddOpen(false)}
            onAdded={(detail) => {
              setActionError(null);
              setList(detail);
            }}
            onError={setActionError}
          />
        </>
      ) : null}
    </AppShell>
  );
}

export default function ListDetailPage() {
  return (
    <AuthGuard>
      <ListDetailContent />
    </AuthGuard>
  );
}

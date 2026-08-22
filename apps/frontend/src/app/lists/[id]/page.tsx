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
  ListMediaQuery,
  MediaItem,
} from '@mediashelf/shared-types';
import { allowedStatusesForList, MediaType } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { AddLibraryToListModal } from '@/components/add-library-to-list-modal';
import {
  ListEditorFields,
  emptyListEditorValues,
  listEditorPayload,
  listEditorValuesFromList,
  type ListEditorValues,
} from '@/components/list-editor-fields';
import {
  DEFAULT_LIBRARY_FILTERS,
  LibraryFilterSortControls,
  type LibraryFiltersState,
} from '@/components/library-filters';
import { MediaCard } from '@/components/media-card';
import {
  MediaPagination,
  useMediaPageSize,
  usePanelColumnCount,
} from '@/components/media-pagination';
import {
  MediaViewToggle,
  useMediaViewMode,
} from '@/components/media-view-toggle';
import { SeriesProgressControls } from '@/components/series-progress-controls';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ViewTip } from '@/components/view-tip';
import { useI18n } from '@/components/locale-provider';
import {
  deleteCustomList,
  getCustomList,
  removeMediaFromList,
  updateCustomList,
  updateListItem,
} from '@/lib/api';
import { resolvePageSize } from '@/lib/media-pagination';
import { mediaCollectionClassName } from '@/lib/media-view-mode';
import { formatListStateSummary } from '@/lib/list-state';
import { useRefreshLastAirDates } from '@/lib/refresh-last-air-dates';

function toListQuery(filters: LibraryFiltersState): ListMediaQuery {
  const search = filters.search.trim();
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.genre ? { genre: filters.genre } : {}),
    ...(filters.downloaded
      ? { downloaded: filters.downloaded === 'true' }
      : {}),
    ...(filters.released ? { released: filters.released === 'true' } : {}),
    ...(search ? { search } : {}),
    sortBy: filters.sortBy,
  };
}

function ListDetailContent() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [list, setList] = useState<CustomListDetail | null>(null);
  const [editorValues, setEditorValues] = useState<ListEditorValues>(
    emptyListEditorValues(),
  );
  const [filters, setFilters] = useState<LibraryFiltersState>(
    DEFAULT_LIBRARY_FILTERS,
  );
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useMediaViewMode();
  const [pageSizeChoice, setPageSizeChoice] = useMediaPageSize();
  const columns = usePanelColumnCount();
  const resolvedPageSize = resolvePageSize(
    pageSizeChoice,
    viewMode,
    columns ?? 2,
  );
  const pageSizeReady =
    pageSizeChoice !== 'default' || viewMode === 'list' || columns !== null;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [filters.search]);

  const query = useMemo(
    () =>
      toListQuery({
        status: filters.status,
        type: filters.type,
        genre: filters.genre,
        downloaded: filters.downloaded,
        released: filters.released,
        listId: filters.listId,
        search: debouncedSearch,
        sortBy: filters.sortBy,
      }),
    [
      filters.status,
      filters.type,
      filters.genre,
      filters.downloaded,
      filters.released,
      filters.listId,
      filters.sortBy,
      debouncedSearch,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [query, resolvedPageSize, id]);

  const load = useCallback(async () => {
    if (!pageSizeReady) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const detail = await getCustomList(id, {
        ...query,
        page,
        pageSize: resolvedPageSize,
      });
      setList(detail);
      setEditorValues(listEditorValuesFromList(detail));
      if (detail.page !== page) {
        setPage(detail.page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('listDetail.loadFailed'));
      setList(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, page, pageSizeReady, query, resolvedPageSize, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEditModal() {
    if (!list) {
      return;
    }
    setEditorValues(listEditorValuesFromList(list));
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

    const payload = listEditorPayload(editorValues);
    if (!payload.name) {
      setFormError(t('lists.nameRequired'));
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const updated = await updateCustomList(list.id, payload);
      setList((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              description: updated.description,
              defaultStatus: updated.defaultStatus,
              defaultDownloaded: updated.defaultDownloaded,
              updatedAt: updated.updatedAt,
            }
          : prev,
      );
      setEditorValues(listEditorValuesFromList(updated));
      setIsEditOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t('lists.updateFailed'),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteList() {
    if (!list) {
      return;
    }
    const confirmed = window.confirm(
      t('lists.deleteConfirm', { name: list.name }),
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomList(list.id);
      router.push('/lists');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t('lists.deleteFailed'),
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

  useRefreshLastAirDates(
    list?.items.map((entry) => entry.mediaItem) ?? [],
    handleUpdated,
  );

  async function handleDeleted() {
    setActionError(null);
    await load();
  }

  async function handleRemoveFromList(mediaItemId: string) {
    if (!list) {
      return;
    }
    try {
      await removeMediaFromList(list.id, mediaItemId);
      await load();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t('listDetail.removeFailed'),
      );
    }
  }

  function handleEntryUpdated(updated: CustomListEntry) {
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

  const genres = list?.genres ?? [];

  const existingMediaItemIds = useMemo(() => {
    if (!list) {
      return new Set<string>();
    }
    return new Set(list.itemIds);
  }, [list]);

  const visibleItems = list?.items ?? [];

  const hasActiveFilters =
    filters.status !== '' ||
    filters.type !== '' ||
    filters.genre !== '' ||
    filters.downloaded !== '' ||
    filters.released !== '' ||
    filters.search.trim() !== '';

  const stateSummary = list ? formatListStateSummary(list, t) : null;
  const allowedStatuses = list
    ? allowedStatusesForList(list.defaultStatus)
    : null;

  return (
    <AppShell width="wide">
      <Link
        href="/lists"
        className="text-sm text-muted transition hover:text-foreground"
      >
        {t('listDetail.back')}
      </Link>

      {isLoading && !list ? (
        <p className="mt-10 text-sm text-muted">{t('common.loading')}</p>
      ) : null}

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
              {stateSummary ? (
                <p className="mt-2 text-sm text-muted">{stateSummary}</p>
              ) : null}
              <p className="mt-2 text-sm text-muted">
                {list.itemCount === 1
                  ? t('lists.titleCountOne', { count: list.itemCount })
                  : t('lists.titleCountMany', { count: list.itemCount })}
                {hasActiveFilters
                  ? ` · ${
                      list.total === 1
                        ? t('listDetail.matchCountOne', { count: list.total })
                        : t('listDetail.matchCountMany', { count: list.total })
                    }`
                  : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MediaViewToggle value={viewMode} onChange={setViewMode} />
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
                {t('listDetail.addFromLibrary')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openEditModal}
              >
                {t('listDetail.editList')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10"
                onClick={() => void handleDeleteList()}
              >
                {t('listDetail.deleteList')}
              </Button>
            </div>
          </div>

          <ViewTip id="list-detail" />

          {hasActiveFilters ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted">{t('library.filtersActive')}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFiltersOnly}
              >
                {t('library.clearFilters')}
              </Button>
            </div>
          ) : null}

          {actionError ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              {actionError}
            </p>
          ) : null}

          {list.itemCount === 0 ? (
            <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
              <p className="font-display text-xl text-foreground">
                {t('listDetail.emptyTitle')}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                {t('listDetail.emptyBody')}
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
                {t('listDetail.addFromLibrary')}
              </Button>
            </div>
          ) : list.total === 0 ? (
            <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
              <p className="font-display text-xl text-foreground">
                {t('listDetail.noMatchTitle')}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                {t('listDetail.noMatchBody')}
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                onClick={resetFiltersOnly}
              >
                {t('library.clearFilters')}
              </Button>
            </div>
          ) : (
            <>
              <MediaPagination
                meta={{
                  page: list.page,
                  pageSize: list.pageSize,
                  total: list.total,
                  totalPages: list.totalPages,
                }}
                pageSizeChoice={pageSizeChoice}
                viewMode={viewMode}
                columns={columns ?? 2}
                onPageChange={setPage}
                onPageSizeChange={(choice) => {
                  setPage(1);
                  setPageSizeChoice(choice);
                }}
              />
              <div className={mediaCollectionClassName(viewMode)}>
                {visibleItems.map((entry) => (
                  <MediaCard
                    key={entry.mediaItemId}
                    item={entry.mediaItem}
                    variant={viewMode}
                    fromListId={list.id}
                    allowedStatuses={allowedStatuses}
                    status={entry.status}
                    onStatusChange={async (nextStatus) => {
                      const updated = await updateListItem(
                        list.id,
                        entry.mediaItemId,
                        { status: nextStatus },
                      );
                      handleEntryUpdated(updated);
                    }}
                    downloaded={entry.downloaded}
                    onDownloadedChange={async (nextDownloaded) => {
                      const updated = await updateListItem(
                        list.id,
                        entry.mediaItemId,
                        { downloaded: nextDownloaded },
                      );
                      handleEntryUpdated(updated);
                    }}
                    progressSeason={entry.currentSeason}
                    progressEpisode={entry.currentEpisode}
                    onUpdated={handleUpdated}
                    onDeleted={() => void handleDeleted()}
                    onError={setActionError}
                    actions={
                      <>
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
                              handleEntryUpdated(updated);
                            }}
                            onError={setActionError}
                          />
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={
                            viewMode === 'grid' ? 'w-full text-xs' : 'text-xs'
                          }
                          onClick={() =>
                            void handleRemoveFromList(entry.mediaItemId)
                          }
                        >
                          {t('listDetail.removeFromList')}
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            </>
          )}

          <Modal
            open={isEditOpen}
            title={t('listDetail.editList')}
            onClose={closeEditModal}
          >
            <form
              onSubmit={(event) => void handleSave(event)}
              className="space-y-4"
            >
              <ListEditorFields
                values={editorValues}
                disabled={isSaving}
                onChange={setEditorValues}
              />

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
                  {t('common.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? t('common.saving') : t('lists.saveChanges')}
                </Button>
              </div>
            </form>
          </Modal>

          <AddLibraryToListModal
            open={isAddOpen}
            listId={list.id}
            existingMediaItemIds={existingMediaItemIds}
            onClose={() => setIsAddOpen(false)}
            onAdded={() => {
              setActionError(null);
              void load();
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

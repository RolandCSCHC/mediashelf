'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  CustomList,
  ListMediaQuery,
  MediaItem,
  PaginationMeta,
} from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
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
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/locale-provider';
import { Button } from '@/components/ui/button';
import { listCustomLists, listMedia } from '@/lib/api';
import { resolvePageSize } from '@/lib/media-pagination';
import { useRefreshLastAirDates } from '@/lib/refresh-last-air-dates';
import { mediaCollectionClassName } from '@/lib/media-view-mode';

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
    ...(filters.listId ? { listId: filters.listId } : {}),
    ...(search ? { search } : {}),
    sortBy: filters.sortBy,
  };
}

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  pageSize: 0,
  total: 0,
  totalPages: 0,
};

function LibraryContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0];
  const [items, setItems] = useState<MediaItem[]>([]);
  const [lists, setLists] = useState<CustomList[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);
  const [filters, setFilters] = useState<LibraryFiltersState>(
    DEFAULT_LIBRARY_FILTERS,
  );
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
  }, [query, resolvedPageSize]);

  const loadOptions = useCallback(async () => {
    const customLists = await listCustomLists();
    setLists(customLists);
  }, []);

  const load = useCallback(async () => {
    if (!pageSizeReady) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const media = await listMedia({
        ...query,
        page,
        pageSize: resolvedPageSize,
      });
      setItems(media.items);
      setGenres(media.genres);
      setPagination({
        page: media.page,
        pageSize: media.pageSize,
        total: media.total,
        totalPages: media.totalPages,
      });
      if (media.page !== page) {
        setPage(media.page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('library.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSizeReady, query, resolvedPageSize, t]);

  useEffect(() => {
    void loadOptions().catch((err) => {
      setError(
        err instanceof Error ? err.message : t('library.loadFiltersFailed'),
      );
    });
  }, [loadOptions, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleUpdated(updated: MediaItem) {
    setActionError(null);
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  useRefreshLastAirDates(items, handleUpdated);

  function handleDeleted(id: string) {
    setActionError(null);
    setItems((prev) => prev.filter((item) => item.id !== id));
    void load();
  }

  function resetFiltersOnly() {
    setFilters((prev) => ({
      ...DEFAULT_LIBRARY_FILTERS,
      sortBy: prev.sortBy,
    }));
  }

  const hasActiveFilters =
    filters.status !== '' ||
    filters.type !== '' ||
    filters.genre !== '' ||
    filters.downloaded !== '' ||
    filters.released !== '' ||
    filters.listId !== '' ||
    filters.search.trim() !== '';

  const showCollection = !isLoading || items.length > 0;

  return (
    <AppShell width="wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ms-animate-fade-up mb-2 text-sm uppercase tracking-[0.2em] text-muted">
            {t('library.kicker')}
          </p>
          <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {firstName
              ? t('library.headingNamed', { name: firstName })
              : t('library.headingYours')}
          </h1>
          <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 max-w-xl text-muted">
            {t('library.description')}{' '}
            <Link href="/backup" className="text-accent hover:underline">
              {t('library.exportImportLink')}
            </Link>
          </p>
        </div>
        <div className="ms-animate-fade-up ms-animate-delay-3 flex flex-wrap items-center gap-2">
          <MediaViewToggle value={viewMode} onChange={setViewMode} />
          <LibraryFilterSortControls
            value={filters}
            genres={genres}
            lists={lists}
            onChange={setFilters}
            onResetFilters={resetFiltersOnly}
          />
        </div>
      </div>

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

      {error ? (
        <p className="mt-8 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {actionError ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {actionError}
        </p>
      ) : null}

      {isLoading && items.length === 0 ? (
        <p className="mt-10 text-sm text-muted">{t('library.loading')}</p>
      ) : null}

      {showCollection && items.length === 0 && !error ? (
        <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
          <p className="font-display text-xl text-foreground">
            {hasActiveFilters
              ? t('library.noMatchTitle')
              : t('library.emptyTitle')}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            {hasActiveFilters
              ? t('library.noMatchBody')
              : t('library.emptyBody')}
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('library.goToSearch')}
          </Link>
        </div>
      ) : null}

      {showCollection && pagination.total > 0 ? (
        <>
          <MediaPagination
            meta={pagination}
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
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                variant={viewMode}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onError={setActionError}
              />
            ))}
          </div>
        </>
      ) : null}
    </AppShell>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard>
      <LibraryContent />
    </AuthGuard>
  );
}

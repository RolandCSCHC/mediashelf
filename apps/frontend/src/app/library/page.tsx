'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  CustomList,
  ListMediaQuery,
  MediaItem,
} from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import {
  DEFAULT_LIBRARY_FILTERS,
  LibraryFilterSortControls,
  type LibraryFiltersState,
} from '@/components/library-filters';
import { MediaCard } from '@/components/media-card';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { listCustomLists, listMedia } from '@/lib/api';

function toListQuery(filters: LibraryFiltersState): ListMediaQuery {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.genre ? { genre: filters.genre } : {}),
    ...(filters.downloaded
      ? { downloaded: filters.downloaded === 'true' }
      : {}),
    ...(filters.listId ? { listId: filters.listId } : {}),
    sortBy: filters.sortBy,
  };
}

function LibraryContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0];
  const [items, setItems] = useState<MediaItem[]>([]);
  const [lists, setLists] = useState<CustomList[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [filters, setFilters] = useState<LibraryFiltersState>(
    DEFAULT_LIBRARY_FILTERS,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useMemo(() => toListQuery(filters), [filters]);

  const loadOptions = useCallback(async () => {
    const [allItems, customLists] = await Promise.all([
      listMedia(),
      listCustomLists(),
    ]);

    const nextGenres = Array.from(
      new Set(allItems.flatMap((item) => item.genres)),
    ).sort((a, b) => a.localeCompare(b));

    setGenres(nextGenres);
    setLists(customLists);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const media = await listMedia(query);
      setItems(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadOptions().catch((err) => {
      setError(
        err instanceof Error ? err.message : 'Failed to load filter options',
      );
    });
  }, [loadOptions]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleUpdated(updated: MediaItem) {
    setActionError(null);
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  function handleDeleted(id: string) {
    setActionError(null);
    setItems((prev) => prev.filter((item) => item.id !== id));
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
    filters.listId !== '';

  return (
    <AppShell width="wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ms-animate-fade-up mb-2 text-sm uppercase tracking-[0.2em] text-muted">
            Private library
          </p>
          <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {firstName ? `${firstName}'s shelf` : 'Your shelf'}
          </h1>
          <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 max-w-xl text-muted">
            Filter and sort your shelf, organize titles into custom lists, and
            track series progress per list.
          </p>
        </div>
        <div className="ms-animate-fade-up ms-animate-delay-3 flex flex-wrap gap-2">
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

      {isLoading ? (
        <p className="mt-10 text-sm text-muted">Loading library…</p>
      ) : null}

      {!isLoading && items.length === 0 && !error ? (
        <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
          <p className="font-display text-xl text-foreground">
            {hasActiveFilters ? 'No titles match' : 'Your shelf is empty'}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            {hasActiveFilters
              ? 'Try clearing filters, or search TMDB to add something new.'
              : 'Search TMDB and add movies or series to start building your library.'}
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Go to search
          </Link>
        </div>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onError={setActionError}
            />
          ))}
        </div>
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

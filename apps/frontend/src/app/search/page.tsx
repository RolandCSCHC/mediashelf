'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MediaType, type TmdbSearchResult } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { ManualMediaForm } from '@/components/manual-media-form';
import { SearchResultCard } from '@/components/search-result-card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/locale-provider';
import { listAllMedia, searchTmdb } from '@/lib/api';
import {
  parseSearchTypeFilter,
  searchHref,
  type SearchTypeFilter,
} from '@/lib/tmdb-preview';

function SearchContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q')?.trim() ?? '';
  const urlFilter = parseSearchTypeFilter(searchParams.get('type'));

  const [query, setQuery] = useState(urlQuery);
  const [filter, setFilter] = useState<SearchTypeFilter>(urlFilter);
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [libraryIds, setLibraryIds] = useState<Map<string, string>>(new Map());
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const hydratedQuery = useRef<string | null>(null);

  const filters: {
    value: SearchTypeFilter;
    labelKey: 'search.filterAll' | 'common.movies' | 'common.series';
  }[] = [
    { value: 'ALL', labelKey: 'search.filterAll' },
    { value: 'MOVIE', labelKey: 'common.movies' },
    { value: 'SERIES', labelKey: 'common.series' },
  ];

  const initialManualType =
    filter === 'SERIES' ? MediaType.SERIES : MediaType.MOVIE;

  function openManualForm(title = '') {
    setManualTitle(title);
    setShowManualForm(true);
  }

  const runSearch = useCallback(
    async (searchQuery: string, searchFilter: SearchTypeFilter) => {
      setIsSearching(true);
      setError(null);
      setHasSearched(true);
      setShowManualForm(false);

      try {
        const [searchResponse, media] = await Promise.all([
          searchTmdb(searchQuery, searchFilter),
          listAllMedia(),
        ]);

        setResults(searchResponse.results);
        setLibraryIds(
          new Map(
            media
              .filter((item) => item.tmdbId != null)
              .map((item) => [`${item.type}:${item.tmdbId}`, item.id]),
          ),
        );

        if (searchResponse.results.length === 0) {
          setManualTitle(searchQuery);
          setShowManualForm(true);
        }
      } catch (err) {
        setResults([]);
        setError(err instanceof Error ? err.message : t('search.failed'));
      } finally {
        setIsSearching(false);
      }
    },
    [t],
  );

  useEffect(() => {
    setQuery(urlQuery);
    setFilter(urlFilter);

    if (!urlQuery) {
      hydratedQuery.current = '';
      setResults([]);
      setHasSearched(false);
      return;
    }

    const hydrateKey = `${urlFilter}:${urlQuery}`;
    if (hydratedQuery.current === hydrateKey) {
      return;
    }
    hydratedQuery.current = hydrateKey;
    void runSearch(urlQuery, urlFilter);
  }, [urlQuery, urlFilter, runSearch]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const href = searchHref(trimmed, filter);
    const current = searchHref(urlQuery, urlFilter);
    if (href === current) {
      void runSearch(trimmed, filter);
      return;
    }

    router.replace(href);
  }

  function handleImported(
    tmdbId: number,
    type: MediaType,
    mediaItemId: string,
  ) {
    setLibraryIds((prev) =>
      new Map(prev).set(`${type}:${tmdbId}`, mediaItemId),
    );
  }

  return (
    <AppShell width="wide">
      <p className="ms-animate-fade-up mb-2 text-sm uppercase tracking-[0.2em] text-muted">
        {t('search.kicker')}
      </p>
      <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {t('search.heading')}
      </h1>
      <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 max-w-xl text-muted">
        {t('search.description')}
      </p>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="ms-animate-fade-up ms-animate-delay-3 mt-8 space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full flex-1 rounded-md border border-border bg-surface px-4 py-2.5 text-foreground outline-none ring-[var(--ring)] placeholder:text-muted focus:ring-2"
            aria-label={t('search.queryAria')}
          />
          <Button type="submit" disabled={isSearching || !query.trim()}>
            {isSearching ? t('search.searching') : t('search.search')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('search.typeFilterAria')}
          >
            {filters.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={[
                  'rounded-md border px-3 py-1.5 text-sm transition',
                  filter === option.value
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-surface text-muted hover:text-foreground',
                ].join(' ')}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>

          {!showManualForm ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => openManualForm(query.trim())}
            >
              {t('search.addManually')}
            </Button>
          ) : null}
        </div>
      </form>

      {error ? (
        <p className="mt-6 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {showManualForm ? (
        <div className="mt-8">
          <ManualMediaForm
            initialTitle={manualTitle}
            initialType={initialManualType}
            onCancel={() => setShowManualForm(false)}
          />
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {!hasSearched && !showManualForm ? (
          <p className="text-sm text-muted">{t('search.prompt')}</p>
        ) : null}

        {hasSearched &&
        !isSearching &&
        results.length === 0 &&
        !error &&
        !showManualForm ? (
          <p className="text-sm text-muted">
            {t('search.noResults')}{' '}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => openManualForm(query.trim())}
            >
              {t('search.addManually')}
            </button>
          </p>
        ) : null}

        {results.map((result) => {
          const libraryKey = `${result.type}:${result.tmdbId}`;
          const libraryItemId = libraryIds.get(libraryKey) ?? null;

          return (
            <SearchResultCard
              key={libraryKey}
              result={result}
              searchQuery={urlQuery || query}
              alreadyInLibrary={libraryItemId !== null}
              libraryItemId={libraryItemId}
              onImported={handleImported}
            />
          );
        })}
      </div>
    </AppShell>
  );
}

function SearchFallback() {
  const { t } = useI18n();

  return (
    <AppShell width="wide">
      <p className="mt-10 text-sm text-muted">{t('common.loading')}</p>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
    </AuthGuard>
  );
}

'use client';

import { useState } from 'react';
import { MediaType, type TmdbSearchResult } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { ManualMediaForm } from '@/components/manual-media-form';
import { SearchResultCard } from '@/components/search-result-card';
import { Button } from '@/components/ui/button';
import { listMedia, searchTmdb } from '@/lib/api';

type SearchFilter = 'ALL' | 'MOVIE' | 'SERIES';

function SearchContent() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('ALL');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [libraryKeys, setLibraryKeys] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');

  const filters: { value: SearchFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'MOVIE', label: 'Movies' },
    { value: 'SERIES', label: 'Series' },
  ];

  const initialManualType =
    filter === 'SERIES' ? MediaType.SERIES : MediaType.MOVIE;

  function openManualForm(title = '') {
    setManualTitle(title);
    setShowManualForm(true);
  }

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    setShowManualForm(false);

    try {
      const [searchResponse, media] = await Promise.all([
        searchTmdb(trimmed, filter),
        listMedia(),
      ]);

      setResults(searchResponse.results);
      setLibraryKeys(
        new Set(
          media
            .filter((item) => item.tmdbId != null)
            .map((item) => `${item.type}:${item.tmdbId}`),
        ),
      );

      if (searchResponse.results.length === 0) {
        openManualForm(trimmed);
      }
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }

  function handleImported(tmdbId: number, type: MediaType) {
    setLibraryKeys((prev) => new Set(prev).add(`${type}:${tmdbId}`));
  }

  return (
    <AppShell width="wide">
      <p className="ms-animate-fade-up mb-2 text-sm uppercase tracking-[0.2em] text-muted">
        Discover
      </p>
      <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Search TMDB
      </h1>
      <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 max-w-xl text-muted">
        Find a movie or series, then add it to your private library. If TMDB
        does not have it, add it manually.
      </p>

      <form
        onSubmit={(event) => void runSearch(event)}
        className="ms-animate-fade-up ms-animate-delay-3 mt-8 space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="The Lord of the Rings"
            className="w-full flex-1 rounded-md border border-border bg-surface px-4 py-2.5 text-foreground outline-none ring-[var(--ring)] placeholder:text-muted focus:ring-2"
            aria-label="Search query"
          />
          <Button type="submit" disabled={isSearching || !query.trim()}>
            {isSearching ? 'Searching…' : 'Search'}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Type filter"
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
                {option.label}
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
              Add manually
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
          <p className="text-sm text-muted">
            Enter a title to search The Movie Database.
          </p>
        ) : null}

        {hasSearched &&
        !isSearching &&
        results.length === 0 &&
        !error &&
        !showManualForm ? (
          <p className="text-sm text-muted">
            No results found.{' '}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => openManualForm(query.trim())}
            >
              Add manually
            </button>
          </p>
        ) : null}

        {results.map((result) => (
          <SearchResultCard
            key={`${result.type}-${result.tmdbId}`}
            result={result}
            alreadyInLibrary={libraryKeys.has(
              `${result.type}:${result.tmdbId}`,
            )}
            onImported={handleImported}
          />
        ))}
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <AuthGuard>
      <SearchContent />
    </AuthGuard>
  );
}

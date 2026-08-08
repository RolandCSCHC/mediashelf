'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { MediaItem } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { MediaCard } from '@/components/media-card';
import { useAuth } from '@/components/auth-provider';
import { ButtonLink } from '@/components/ui/button';
import { listMedia } from '@/lib/api';

function LibraryContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0];
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const media = await listMedia();
      setItems(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
            Titles you import from TMDB land here.
          </p>
        </div>
        <div className="ms-animate-fade-up ms-animate-delay-3">
          <ButtonLink href="/search">Search TMDB</ButtonLink>
        </div>
      </div>

      {error ? (
        <p className="mt-8 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-10 text-sm text-muted">Loading library…</p>
      ) : null}

      {!isLoading && items.length === 0 && !error ? (
        <div className="mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
          <p className="font-display text-xl text-foreground">
            Your shelf is empty
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Search TMDB and add movies or series to start building your library.
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
            <MediaCard key={item.id} item={item} />
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

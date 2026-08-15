'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import type { TmdbTitleDetails } from '@mediashelf/shared-types';
import { AddToLibraryButton } from '@/components/add-to-library-button';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { TmdbTitleCredits } from '@/components/tmdb-title-credits';
import { getTmdbTitle, listAllMedia } from '@/lib/api';
import { tmdbBackdropUrl, tmdbPosterUrl } from '@/lib/tmdb-images';
import { mediaTypeFromPreviewKind, searchHref } from '@/lib/tmdb-preview';

function formatRuntime(
  minutes: number | null,
  type: TmdbTitleDetails['type'],
): string | null {
  if (!minutes) {
    return null;
  }
  return type === 'SERIES' ? `${minutes} min/ep` : `${minutes} min`;
}

function TmdbPreviewContent() {
  const params = useParams<{ type: string; tmdbId: string }>();
  const searchParams = useSearchParams();
  const mediaType = mediaTypeFromPreviewKind(params.type);
  const tmdbId = Number(params.tmdbId);
  const backQuery = searchParams.get('q');
  const backHref = searchHref(backQuery);

  const [details, setDetails] = useState<TmdbTitleDetails | null>(null);
  const [libraryItemId, setLibraryItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!mediaType || !Number.isInteger(tmdbId) || tmdbId < 1) {
      setError('This TMDB title could not be found.');
      setDetails(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [title, media] = await Promise.all([
        getTmdbTitle(mediaType, tmdbId),
        listAllMedia(),
      ]);
      const existing = media.find(
        (item) => item.tmdbId === tmdbId && item.type === mediaType,
      );

      setDetails(title);
      setLibraryItemId(existing?.id ?? null);
    } catch (err) {
      setDetails(null);
      setError(err instanceof Error ? err.message : 'Failed to load title');
    } finally {
      setIsLoading(false);
    }
  }, [mediaType, tmdbId]);

  useEffect(() => {
    void load();
  }, [load]);

  const poster = details ? tmdbPosterUrl(details.posterPath, 'w500') : null;
  const backdrop = details
    ? tmdbBackdropUrl(details.backdropPath, 'w1280')
    : null;
  const year = details?.releaseDate
    ? new Date(details.releaseDate).getFullYear()
    : null;
  const runtime = details ? formatRuntime(details.runtime, details.type) : null;
  const rating =
    details?.voteAverage != null ? details.voteAverage.toFixed(1) : null;
  const seasons =
    details?.seasonCount != null
      ? `${details.seasonCount} season${details.seasonCount === 1 ? '' : 's'}`
      : null;
  const meta = [
    details?.type === 'MOVIE' ? 'Movie' : 'Series',
    year ? String(year) : null,
    runtime,
    seasons,
    rating ? `TMDB ${rating}` : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <AppShell width="wide">
      <Link
        href={backHref}
        className="text-sm text-muted transition hover:text-foreground"
      >
        ← Back to search
      </Link>

      {isLoading ? <p className="mt-10 text-sm text-muted">Loading…</p> : null}

      {error && !details ? (
        <p className="mt-10 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {details ? (
        <div className="mt-8">
          {backdrop ? (
            <div className="relative mb-8 overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backdrop}
                alt=""
                className="h-40 w-full object-cover sm:h-56"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>
          ) : null}

          <div className="grid gap-8 md:grid-cols-[220px_1fr]">
            <div className="overflow-hidden rounded-lg border border-border bg-[var(--overlay)]">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster}
                  alt=""
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center text-sm text-muted">
                  No poster
                </div>
              )}
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                {meta.join(' · ')}
              </p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {details.title}
              </h1>

              {details.genres.length > 0 ? (
                <p className="mt-3 text-sm text-muted">
                  {details.genres.join(' · ')}
                </p>
              ) : null}

              {details.overview ? (
                <p className="mt-5 max-w-2xl text-muted">{details.overview}</p>
              ) : null}

              <div className="mt-8">
                <AddToLibraryButton
                  tmdbId={details.tmdbId}
                  type={details.type}
                  alreadyInLibrary={libraryItemId !== null}
                  libraryItemId={libraryItemId}
                  onImported={(_tmdbId, _type, mediaItemId) => {
                    setLibraryItemId(mediaItemId);
                  }}
                />
              </div>
            </div>
          </div>

          <TmdbTitleCredits details={details} />
        </div>
      ) : null}
    </AppShell>
  );
}

export default function TmdbPreviewPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <AppShell width="wide">
            <p className="mt-10 text-sm text-muted">Loading…</p>
          </AppShell>
        }
      >
        <TmdbPreviewContent />
      </Suspense>
    </AuthGuard>
  );
}

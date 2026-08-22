'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { MediaItem } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { ListMembershipControls } from '@/components/list-membership-controls';
import { LibraryTmdbCredits } from '@/components/library-tmdb-credits';
import { MediaItemControls } from '@/components/media-item-controls';
import { getMedia } from '@/lib/api';
import { formatReleaseLabel } from '@/lib/format-date';
import { useRefreshLastAirDates } from '@/lib/refresh-last-air-dates';
import { tmdbPosterUrl } from '@/lib/tmdb-images';
import { useI18n } from '@/components/locale-provider';

const LIST_ID_PATTERN = /^[a-z0-9]+$/i;

function MediaDetailContent() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const rawFromList = searchParams.get('fromList');
  const fromListId =
    rawFromList && LIST_ID_PATTERN.test(rawFromList) ? rawFromList : null;
  const backHref = fromListId ? `/lists/${fromListId}` : '/library';
  const backLabel = fromListId
    ? t('media.backToList')
    : t('media.backToLibrary');

  const [item, setItem] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const media = await getMedia(id);
      setItem(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('media.loadFailed'));
      setItem(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const poster = item ? tmdbPosterUrl(item.posterPath, 'w500') : null;
  const releaseLabel = item ? formatReleaseLabel(item, locale) : null;

  useRefreshLastAirDates(item ? [item] : [], (updated) => {
    setItem(updated);
  });

  return (
    <AppShell width="wide">
      <Link
        href={backHref}
        className="text-sm text-muted transition hover:text-foreground"
      >
        {backLabel}
      </Link>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted">{t('common.loading')}</p>
      ) : null}

      {error && !item ? (
        <p className="mt-10 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {item ? (
        <div className="mt-8">
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
                  {t('common.noPoster')}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                {item.type === 'MOVIE' ? t('common.movie') : t('common.series')}
                {releaseLabel ? ` · ${releaseLabel}` : ''}
              </p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {item.title}
              </h1>

              {item.genres.length > 0 ? (
                <p className="mt-3 text-sm text-muted">
                  {item.genres.join(' · ')}
                </p>
              ) : null}

              {item.description ? (
                <p className="mt-5 max-w-2xl text-muted">{item.description}</p>
              ) : null}

              {item.notes ? (
                <div className="mt-4 max-w-2xl rounded-md border border-border bg-[var(--overlay)] px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    {t('common.notes')}
                  </p>
                  <div className="mt-1 space-y-1 text-sm text-foreground">
                    {item.notes.split('\n').map((line, index) =>
                      /^https?:\/\//i.test(line) ? (
                        <a
                          key={`${line}-${index}`}
                          href={line}
                          target="_blank"
                          rel="noreferrer"
                          className="block break-all text-accent hover:underline"
                        >
                          {line}
                        </a>
                      ) : (
                        <p key={`${line}-${index}`}>{line}</p>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 max-w-md space-y-8">
                <MediaItemControls
                  item={item}
                  layout="full"
                  onUpdated={(updated) => {
                    setError(null);
                    setItem(updated);
                  }}
                  onDeleted={() => {
                    router.push(backHref);
                  }}
                  onError={setError}
                />

                <ListMembershipControls
                  mediaItem={item}
                  onMediaUpdated={(updated) => {
                    setError(null);
                    setItem(updated);
                  }}
                  onError={setError}
                />
              </div>

              {error ? (
                <p className="mt-4 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          {item.tmdbId != null ? (
            <LibraryTmdbCredits tmdbId={item.tmdbId} type={item.type} />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}

function MediaDetailFallback() {
  const { t } = useI18n();

  return (
    <AppShell width="wide">
      <p className="mt-10 text-sm text-muted">{t('common.loading')}</p>
    </AppShell>
  );
}

export default function MediaDetailPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<MediaDetailFallback />}>
        <MediaDetailContent />
      </Suspense>
    </AuthGuard>
  );
}

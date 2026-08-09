'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  ImportConfirmItem,
  ImportMatchConfidence,
  ImportPreviewItem,
  MediaStatus,
  MediaType,
  TmdbSearchResult,
} from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import {
  confirmLibraryImport,
  previewLibraryImport,
} from '@/lib/api';
import { formatMediaStatus } from '@/lib/media-status';
import { tmdbPosterUrl } from '@/lib/tmdb-images';

type DraftItem = ImportPreviewItem & {
  included: boolean;
};

function confidenceLabel(confidence: ImportMatchConfidence): string {
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Needs review';
    case 'none':
      return 'No match';
  }
}

function confidenceClass(confidence: ImportMatchConfidence): string {
  switch (confidence) {
    case 'high':
      return 'text-foreground';
    case 'medium':
      return 'text-muted';
    case 'low':
    case 'none':
      return 'text-danger';
  }
}

function ImportContent() {
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<DraftItem[] | null>(null);
  const [skippedEmptyLines, setSkippedEmptyLines] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!drafts) {
      return null;
    }
    const included = drafts.filter((item) => item.included);
    return {
      total: drafts.length,
      included: included.length,
      needsReview: included.filter(
        (item) =>
          item.confidence === 'low' ||
          item.confidence === 'none' ||
          !item.selected,
      ).length,
      alreadyInLibrary: included.filter((item) => item.alreadyInLibrary)
        .length,
    };
  }, [drafts]);

  async function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }
    const contents = await file.text();
    setText(contents);
    setDrafts(null);
    setResultSummary(null);
    setError(null);
  }

  async function handlePreview() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Paste your library .txt or choose a file first.');
      return;
    }

    setIsPreviewing(true);
    setError(null);
    setResultSummary(null);

    try {
      const response = await previewLibraryImport({ text: trimmed });
      setDrafts(
        response.items.map((item) => ({
          ...item,
          included: Boolean(item.selected) && !item.alreadyInLibrary,
        })),
      );
      setSkippedEmptyLines(response.skippedEmptyLines);
    } catch (err) {
      setDrafts(null);
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setIsPreviewing(false);
    }
  }

  function updateDraft(key: string, patch: Partial<DraftItem>) {
    setDrafts((current) =>
      current
        ? current.map((item) =>
            item.key === key ? { ...item, ...patch } : item,
          )
        : current,
    );
  }

  function selectCandidate(key: string, candidate: TmdbSearchResult) {
    setDrafts((current) =>
      current
        ? current.map((item) => {
            if (item.key !== key) {
              return item;
            }
            return {
              ...item,
              selected: candidate,
              confidence:
                candidate.title.toLowerCase() ===
                item.searchQuery.toLowerCase()
                  ? 'high'
                  : item.confidence === 'none'
                    ? 'low'
                    : item.confidence,
              alreadyInLibrary: false,
              included: true,
            };
          })
        : current,
    );
  }

  async function handleConfirm() {
    if (!drafts) {
      return;
    }

    const payloadItems: ImportConfirmItem[] = drafts
      .filter((item) => item.included && item.selected)
      .map((item) => ({
        tmdbId: item.selected!.tmdbId,
        type: item.selected!.type,
        status: item.status,
        downloaded: item.downloaded,
        listName: item.listName,
        notes: item.notes,
      }));

    if (payloadItems.length === 0) {
      setError('Select at least one matched title to import.');
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      const response = await confirmLibraryImport({ items: payloadItems });
      setResultSummary(
        `Imported ${response.importedCount}, skipped ${response.skippedCount} existing, ${response.errorCount} failed.`,
      );
      if (response.errorCount === 0) {
        setDrafts(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <AppShell width="wide">
      <p className="ms-animate-fade-up mb-2 text-sm uppercase tracking-[0.2em] text-muted">
        Temporary
      </p>
      <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Import library
      </h1>
      <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 max-w-2xl text-muted">
        Paste your existing .txt, preview TMDB matches, then confirm. Upcoming
        becomes Future; Downloaded becomes Watchlist + downloaded;{' '}
        <code className="text-foreground">---------------</code> marks
        Watching; links go into notes. Confirm also creates the four section
        lists and adds each title to the matching list.
      </p>

      <div className="ms-animate-fade-up ms-animate-delay-3 mt-8 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">
            Library text
          </span>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setDrafts(null);
              setResultSummary(null);
            }}
            rows={14}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2"
            placeholder={`Upcoming Movies:\n1) Example Title (2026)\n\nDownloaded Movies:\n1) Another Title`}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
            <span className="rounded-md border border-border bg-surface px-3 py-2 text-foreground transition hover:bg-[var(--overlay)]">
              Choose .txt file
            </span>
            <input
              type="file"
              accept=".txt,text/plain"
              className="sr-only"
              onChange={(event) =>
                void handleFileChange(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <Button
            type="button"
            disabled={isPreviewing || isConfirming || !text.trim()}
            onClick={() => void handlePreview()}
          >
            {isPreviewing ? 'Matching with TMDB…' : 'Preview matches'}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {resultSummary ? (
        <p className="mt-4 text-sm text-foreground" role="status">
          {resultSummary}{' '}
          <Link href="/library" className="text-accent hover:underline">
            Open library
          </Link>
        </p>
      ) : null}

      {drafts && stats ? (
        <div className="mt-10 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Review matches
              </h2>
              <p className="mt-1 text-sm text-muted">
                {stats.included} of {stats.total} selected
                {stats.needsReview > 0
                  ? ` · ${stats.needsReview} need review`
                  : ''}
                {stats.alreadyInLibrary > 0
                  ? ` · ${stats.alreadyInLibrary} already in library`
                  : ''}
                {skippedEmptyLines > 0
                  ? ` · ${skippedEmptyLines} empty lines skipped`
                  : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isConfirming}
                onClick={() =>
                  setDrafts((current) =>
                    current
                      ? current.map((item) => ({
                          ...item,
                          included: Boolean(item.selected),
                        }))
                      : current,
                  )
                }
              >
                Select all matched
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isConfirming}
                onClick={() =>
                  setDrafts((current) =>
                    current
                      ? current.map((item) => ({ ...item, included: false }))
                      : current,
                  )
                }
              >
                Clear selection
              </Button>
              <Button
                type="button"
                disabled={isConfirming || stats.included === 0}
                onClick={() => void handleConfirm()}
              >
                {isConfirming
                  ? 'Importing…'
                  : `Import ${stats.included} selected`}
              </Button>
            </div>
          </div>

          <ul className="space-y-4">
            {drafts.map((item) => (
              <ImportPreviewRow
                key={item.key}
                item={item}
                disabled={isConfirming}
                onToggleIncluded={(included) =>
                  updateDraft(item.key, { included })
                }
                onNotesChange={(notes) => updateDraft(item.key, { notes })}
                onSelectCandidate={(candidate) =>
                  selectCandidate(item.key, candidate)
                }
                onStatusChange={(status) => updateDraft(item.key, { status })}
                onDownloadedChange={(downloaded) =>
                  updateDraft(item.key, { downloaded })
                }
              />
            ))}
          </ul>
        </div>
      ) : null}
    </AppShell>
  );
}

function ImportPreviewRow({
  item,
  disabled,
  onToggleIncluded,
  onNotesChange,
  onSelectCandidate,
  onStatusChange,
  onDownloadedChange,
}: {
  item: DraftItem;
  disabled: boolean;
  onToggleIncluded: (included: boolean) => void;
  onNotesChange: (notes: string | null) => void;
  onSelectCandidate: (candidate: TmdbSearchResult) => void;
  onStatusChange: (status: MediaStatus) => void;
  onDownloadedChange: (downloaded: boolean) => void;
}) {
  const poster = tmdbPosterUrl(item.selected?.posterPath, 'w185');

  return (
    <li className="rounded-lg border border-border bg-surface/60 p-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex shrink-0 gap-3">
          <input
            type="checkbox"
            checked={item.included}
            disabled={disabled || !item.selected}
            onChange={(event) => onToggleIncluded(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-[var(--accent)]"
            aria-label={`Include ${item.searchQuery}`}
          />
          <div className="h-24 w-16 overflow-hidden rounded border border-border bg-[var(--overlay)]">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-muted">
                No art
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Line {item.lineNumber} · {item.listName}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {item.searchQuery}
            </p>
            <p className="mt-1 text-xs text-muted">{item.rawLine}</p>
            <p className={`mt-2 text-sm ${confidenceClass(item.confidence)}`}>
              {confidenceLabel(item.confidence)}
              {item.alreadyInLibrary ? ' · Already in library' : ''}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs text-muted">Status</span>
              <select
                value={item.status}
                disabled={disabled}
                onChange={(event) =>
                  onStatusChange(event.target.value as MediaStatus)
                }
                className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2"
              >
                {(
                  [
                    'WATCHLIST',
                    'WATCHING',
                    'WATCHED',
                    'FUTURE',
                  ] as MediaStatus[]
                ).map((status) => (
                  <option key={status} value={status}>
                    {formatMediaStatus(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-end gap-2 pb-1.5">
              <input
                type="checkbox"
                checked={item.downloaded}
                disabled={disabled}
                onChange={(event) => onDownloadedChange(event.target.checked)}
                className="h-4 w-4 rounded border-border accent-[var(--accent)]"
              />
              <span className="text-sm text-foreground">Downloaded</span>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-muted">Notes</span>
            <textarea
              value={item.notes ?? ''}
              disabled={disabled}
              rows={2}
              onChange={(event) =>
                onNotesChange(event.target.value.trim() ? event.target.value : null)
              }
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2"
            />
          </label>

          {item.candidates.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">TMDB candidates</p>
              <div className="flex flex-col gap-2">
                {item.candidates.map((candidate) => {
                  const selected =
                    item.selected?.tmdbId === candidate.tmdbId &&
                    item.selected?.type === candidate.type;
                  const year = candidate.releaseDate
                    ? new Date(candidate.releaseDate).getFullYear()
                    : null;

                  return (
                    <button
                      key={`${candidate.type}:${candidate.tmdbId}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelectCandidate(candidate)}
                      className={[
                        'rounded-md border px-3 py-2 text-left text-sm transition',
                        selected
                          ? 'border-accent bg-accent/10 text-foreground'
                          : 'border-border bg-surface text-muted hover:text-foreground',
                      ].join(' ')}
                    >
                      <span className="font-medium text-foreground">
                        {candidate.title}
                      </span>
                      {year ? ` (${year})` : ''}
                      <span className="text-muted">
                        {' '}
                        · {formatType(candidate.type)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-danger">No TMDB results for this title.</p>
          )}
        </div>
      </div>
    </li>
  );
}

function formatType(type: MediaType): string {
  return type === 'MOVIE' ? 'Movie' : 'Series';
}

export default function ImportPage() {
  return (
    <AuthGuard>
      <ImportContent />
    </AuthGuard>
  );
}

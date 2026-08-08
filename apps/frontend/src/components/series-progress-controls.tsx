'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type SeriesProgressControlsProps = {
  currentSeason: number | null;
  currentEpisode: number | null;
  disabled?: boolean;
  compact?: boolean;
  onSave: (progress: {
    currentSeason: number | null;
    currentEpisode: number | null;
  }) => Promise<void>;
  onError?: (message: string) => void;
};

function parseOptionalPositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

export function SeriesProgressControls({
  currentSeason,
  currentEpisode,
  disabled = false,
  compact = false,
  onSave,
  onError,
}: SeriesProgressControlsProps) {
  const [seasonInput, setSeasonInput] = useState(
    currentSeason?.toString() ?? '',
  );
  const [episodeInput, setEpisodeInput] = useState(
    currentEpisode?.toString() ?? '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const busy = disabled || isSaving;

  useEffect(() => {
    setSeasonInput(currentSeason?.toString() ?? '');
    setEpisodeInput(currentEpisode?.toString() ?? '');
  }, [currentSeason, currentEpisode]);

  async function handleSave() {
    const nextSeason = parseOptionalPositiveInt(seasonInput);
    const nextEpisode = parseOptionalPositiveInt(episodeInput);

    if (seasonInput.trim() && nextSeason === null) {
      onError?.('Season must be a positive whole number');
      return;
    }
    if (episodeInput.trim() && nextEpisode === null) {
      onError?.('Episode must be a positive whole number');
      return;
    }

    if (nextSeason === currentSeason && nextEpisode === currentEpisode) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        currentSeason: nextSeason,
        currentEpisode: nextEpisode,
      });
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : 'Failed to update progress',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass = compact
    ? 'w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60'
    : 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2 disabled:opacity-60';

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact ? (
        <p className="text-sm font-medium text-foreground">Series progress</p>
      ) : null}
      <div
        className={
          compact ? 'grid grid-cols-2 gap-2' : 'grid gap-4 sm:grid-cols-2'
        }
      >
        <label className="block space-y-1">
          <span className={compact ? 'sr-only' : 'text-sm text-muted'}>
            Season
          </span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={seasonInput}
            disabled={busy}
            onChange={(event) => setSeasonInput(event.target.value)}
            className={inputClass}
            placeholder="Season"
            aria-label="Season"
          />
        </label>
        <label className="block space-y-1">
          <span className={compact ? 'sr-only' : 'text-sm text-muted'}>
            Episode
          </span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={episodeInput}
            disabled={busy}
            onChange={(event) => setEpisodeInput(event.target.value)}
            className={inputClass}
            placeholder="Episode"
            aria-label="Episode"
          />
        </label>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => void handleSave()}
        className={compact ? 'w-full text-xs' : undefined}
      >
        {isSaving ? 'Saving…' : compact ? 'Save' : 'Save progress'}
      </Button>
    </div>
  );
}

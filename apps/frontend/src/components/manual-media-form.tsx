'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MediaStatus,
  MediaType,
  type CreateManualMediaRequest,
} from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { createManualMedia } from '@/lib/api';
import { MEDIA_STATUS_OPTIONS } from '@/lib/media-status';

type ManualMediaFormProps = {
  initialTitle?: string;
  initialType?: MediaType;
  onCancel?: () => void;
};

export function ManualMediaForm({
  initialTitle = '',
  initialType = MediaType.MOVIE,
  onCancel,
}: ManualMediaFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [type, setType] = useState<MediaType>(initialType);
  const [releaseYear, setReleaseYear] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<MediaStatus>(MediaStatus.WATCHLIST);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }

    const payload: CreateManualMediaRequest = {
      title: trimmedTitle,
      type,
      status,
    };

    const yearText = releaseYear.trim();
    if (yearText) {
      const year = Number(yearText);
      if (!Number.isInteger(year) || year < 1870 || year > 2100) {
        setError('Release year must be between 1870 and 2100');
        return;
      }
      payload.releaseYear = year;
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription) {
      payload.description = trimmedDescription;
    }

    const trimmedNotes = notes.trim();
    if (trimmedNotes) {
      payload.notes = trimmedNotes;
    }

    setIsSaving(true);
    setError(null);

    try {
      const created = await createManualMedia(payload);
      router.push(`/library/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add title');
      setIsSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] placeholder:text-muted focus:ring-2';

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-4 rounded-lg border border-border bg-[var(--overlay)] p-4"
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">
          Add manually
        </h2>
        <p className="mt-1 text-sm text-muted">
          Use this when TMDB does not have the title you want.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={500}
          className={fieldClass}
          aria-label="Title"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as MediaType)}
            className={fieldClass}
            aria-label="Type"
          >
            <option value={MediaType.MOVIE}>Movie</option>
            <option value={MediaType.SERIES}>Series</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            Year (optional)
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={releaseYear}
            onChange={(event) => setReleaseYear(event.target.value)}
            min={1870}
            max={2100}
            placeholder="2024"
            className={fieldClass}
            aria-label="Release year"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Status</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as MediaStatus)
            }
            className={fieldClass}
            aria-label="Status"
          >
            {MEDIA_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          Description (optional)
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={4000}
          className={fieldClass}
          aria-label="Description"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          Notes (optional)
        </span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          maxLength={4000}
          placeholder="Links, season ranges, or anything else"
          className={fieldClass}
          aria-label="Notes"
        />
      </label>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving || !title.trim()}>
          {isSaving ? 'Adding…' : 'Add to library'}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

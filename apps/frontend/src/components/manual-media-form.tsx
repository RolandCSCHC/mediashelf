'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MediaStatus,
  MediaType,
  type CreateManualMediaRequest,
} from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/locale-provider';
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
  const { t } = useI18n();
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
      setError(t('manual.titleRequired'));
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
        setError(t('manual.yearInvalid'));
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
      setError(err instanceof Error ? err.message : t('manual.addFailed'));
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
          {t('manual.heading')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('manual.description')}</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('manual.title')}
        </span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={500}
          className={fieldClass}
          aria-label={t('manual.title')}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            {t('manual.type')}
          </span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as MediaType)}
            className={fieldClass}
            aria-label={t('manual.type')}
          >
            <option value={MediaType.MOVIE}>{t('common.movie')}</option>
            <option value={MediaType.SERIES}>{t('common.series')}</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            {t('manual.yearOptional')}
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
            aria-label={t('manual.yearAria')}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            {t('manual.status')}
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as MediaStatus)}
            className={fieldClass}
            aria-label={t('manual.status')}
          >
            {MEDIA_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('manual.descriptionOptional')}
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={4000}
          className={fieldClass}
          aria-label={t('manual.description')}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('manual.notesOptional')}
        </span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          maxLength={4000}
          placeholder={t('media.notesPlaceholder')}
          className={fieldClass}
          aria-label={t('common.notes')}
        />
      </label>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving || !title.trim()}>
          {isSaving ? t('manual.adding') : t('manual.addToLibrary')}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

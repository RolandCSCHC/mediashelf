'use client';

import { useEffect, useState } from 'react';
import {
  FeedbackKind,
  type CreateFeedbackRequest,
} from '@mediashelf/shared-types';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/locale-provider';
import { Button } from '@/components/ui/button';
import { submitFeedback } from '@/lib/api';

const FIELD_CLASS =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] placeholder:text-muted focus:ring-2';

export function FeedbackForm() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [kind, setKind] = useState<FeedbackKind>(FeedbackKind.BUG);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user?.email) {
      const accountEmail = user.email;
      setEmail((current) => current || accountEmail);
    }
  }, [user?.email]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedSummary = summary.trim();
    const trimmedDetails = details.trim();
    const trimmedEmail = email.trim();

    if (!trimmedSummary) {
      setError(t('feedback.summaryRequired'));
      return;
    }

    if (!trimmedDetails) {
      setError(t('feedback.detailsRequired'));
      return;
    }

    if (trimmedEmail && !trimmedEmail.includes('@')) {
      setError(t('feedback.emailInvalid'));
      return;
    }

    const payload: CreateFeedbackRequest = {
      kind,
      summary: trimmedSummary,
      details: trimmedDetails,
    };

    if (trimmedEmail) {
      payload.email = trimmedEmail;
    }

    setIsSaving(true);
    setError(null);

    try {
      await submitFeedback(payload);
      setSent(true);
      setSummary('');
      setDetails('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('feedback.submitFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-border bg-surface/60 px-5 py-6">
        <p className="font-medium text-foreground">{t('feedback.sent')}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setSent(false)}
        >
          {t('feedback.sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-foreground">
          {t('feedback.kind')}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <KindOption
            selected={kind === FeedbackKind.BUG}
            title={t('feedback.bugTitle')}
            body={t('feedback.bugBody')}
            onSelect={() => setKind(FeedbackKind.BUG)}
          />
          <KindOption
            selected={kind === FeedbackKind.IMPROVEMENT}
            title={t('feedback.improvementTitle')}
            body={t('feedback.improvementBody')}
            onSelect={() => setKind(FeedbackKind.IMPROVEMENT)}
          />
        </div>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('feedback.summary')}
        </span>
        <input
          type="text"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          required
          maxLength={200}
          className={FIELD_CLASS}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('feedback.details')}
        </span>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          required
          maxLength={4000}
          rows={6}
          className={FIELD_CLASS}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('feedback.email')}
          <span className="ml-1 font-normal text-muted">
            {t('feedback.emailOptional')}
          </span>
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={320}
          autoComplete="email"
          className={FIELD_CLASS}
        />
        <span className="block text-xs text-muted">
          {t('feedback.emailHint')}
        </span>
      </label>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={isSaving}>
        {isSaving ? t('feedback.submitting') : t('feedback.submit')}
      </Button>
    </form>
  );
}

function KindOption({
  selected,
  title,
  body,
  onSelect,
}: {
  selected: boolean;
  title: string;
  body: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'rounded-lg border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        selected
          ? 'border-accent bg-surface text-foreground'
          : 'border-border bg-surface/60 text-foreground hover:bg-[var(--overlay)]',
      ].join(' ')}
    >
      <span className="block font-display text-lg font-semibold">{title}</span>
      <span className="mt-1 block text-sm text-muted">{body}</span>
    </button>
  );
}

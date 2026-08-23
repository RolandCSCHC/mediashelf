'use client';

import { useEffect, useState } from 'react';
import {
  FeedbackKind,
  type FeedbackSubmission,
} from '@mediashelf/shared-types';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/locale-provider';
import { listFeedback } from '@/lib/api';
import { dateLocale, type Locale } from '@/i18n';

export function FeedbackInbox() {
  const { t, locale } = useI18n();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<FeedbackSubmission[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !user) {
      setItems(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void listFeedback().then((result) => {
      if (!cancelled) {
        setItems(result);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, user]);

  if (!user || items === null) {
    return null;
  }

  return (
    <section className="mt-14 border-t border-border/60 pt-10">
      <h2 className="font-display text-2xl font-semibold text-foreground">
        {t('feedback.inboxHeading')}
      </h2>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t('feedback.inboxEmpty')}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border bg-surface/60 px-5 py-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted">
                <span>
                  {item.kind === FeedbackKind.BUG
                    ? t('feedback.bugTitle')
                    : t('feedback.improvementTitle')}
                </span>
                <span aria-hidden>·</span>
                <time dateTime={item.createdAt}>
                  {formatReceivedAt(item.createdAt, locale)}
                </time>
              </div>
              <p className="mt-2 font-medium text-foreground">{item.summary}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                {item.details}
              </p>
              <p className="mt-3 text-xs text-muted">
                {item.email ?? t('feedback.noEmail')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatReceivedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString(dateLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

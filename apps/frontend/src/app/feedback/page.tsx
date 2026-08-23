'use client';

import { AppShell } from '@/components/app-shell';
import { FeedbackForm } from '@/components/feedback-form';
import { FeedbackInbox } from '@/components/feedback-inbox';
import { useI18n } from '@/components/locale-provider';

export default function FeedbackPage() {
  const { t } = useI18n();

  return (
    <AppShell>
      <div>
        <p className="ms-animate-fade-up mb-2 text-sm uppercase tracking-[0.2em] text-muted">
          {t('feedback.kicker')}
        </p>
        <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t('feedback.heading')}
        </h1>
        <p className="ms-animate-fade-up ms-animate-delay-2 mt-4 max-w-xl text-muted">
          {t('feedback.description')}
        </p>
      </div>

      <div className="ms-animate-fade-up ms-animate-delay-3 mt-10">
        <FeedbackForm />
      </div>

      <FeedbackInbox />
    </AppShell>
  );
}

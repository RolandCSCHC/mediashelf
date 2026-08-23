'use client';

import Link from 'next/link';
import { useI18n } from '@/components/locale-provider';

export function FeedbackButton() {
  const { t } = useI18n();
  const label = t('feedback.open');

  return (
    <Link
      href="/feedback"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground transition hover:bg-[var(--overlay)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
    >
      <FeedbackIcon className="h-4 w-4" />
    </Link>
  );
}

function FeedbackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4.5 3.5V16H7.5A2.5 2.5 0 0 1 5 13.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

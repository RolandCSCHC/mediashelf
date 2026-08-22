'use client';

import { useI18n } from '@/components/locale-provider';
import { restoreAllTips } from '@/lib/view-tips';

export function RestoreTipsButton() {
  const { t } = useI18n();
  const label = t('tips.restore');

  return (
    <button
      type="button"
      onClick={() => restoreAllTips()}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground transition hover:bg-[var(--overlay)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
    >
      <HelpIcon className="h-4 w-4" />
    </button>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.25c-.7.4-1.1.9-1.1 1.75" />
      <path d="M12 16.5h.01" strokeLinecap="round" />
    </svg>
  );
}

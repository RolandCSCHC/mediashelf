'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  DEFAULT_MEDIA_VIEW_MODE,
  MEDIA_VIEW_MODE_STORAGE_KEY,
  isMediaViewMode,
  type MediaViewMode,
} from '@/lib/media-view-mode';

type MediaViewToggleProps = {
  value: MediaViewMode;
  onChange: (mode: MediaViewMode) => void;
};

export function useMediaViewMode(): [
  MediaViewMode,
  (mode: MediaViewMode) => void,
] {
  const [mode, setMode] = useState<MediaViewMode>(DEFAULT_MEDIA_VIEW_MODE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MEDIA_VIEW_MODE_STORAGE_KEY);
      if (isMediaViewMode(stored)) {
        setMode(stored);
      }
    } catch {
      // Ignore storage access errors (private mode, etc.).
    }
  }, []);

  function updateMode(next: MediaViewMode) {
    setMode(next);
    try {
      window.localStorage.setItem(MEDIA_VIEW_MODE_STORAGE_KEY, next);
    } catch {
      // Ignore storage write errors.
    }
  }

  return [mode, updateMode];
}

export function MediaViewToggle({ value, onChange }: MediaViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Library layout"
      className="inline-flex rounded-md border border-border bg-surface p-0.5"
    >
      <ToggleButton
        label="Panels"
        active={value === 'grid'}
        onClick={() => onChange('grid')}
      >
        <GridIcon className="h-4 w-4" />
      </ToggleButton>
      <ToggleButton
        label="List"
        active={value === 'list'}
        onClick={() => onChange('list')}
      >
        <ListIcon className="h-4 w-4" />
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={[
        'inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        active
          ? 'bg-[var(--overlay)] text-foreground'
          : 'text-muted hover:text-foreground',
      ].join(' ')}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

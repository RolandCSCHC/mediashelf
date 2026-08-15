'use client';

import { useEffect, useState } from 'react';
import type { PaginationMeta } from '@mediashelf/shared-types';
import { PAGE_SIZE_ALL } from '@mediashelf/shared-types';
import {
  PAGE_SIZE_CHOICES,
  MEDIA_PAGE_SIZE_STORAGE_KEY,
  isPageSizeChoice,
  pageRangeLabel,
  paginationItems,
  parseStoredPageSizeChoice,
  panelColumnCount,
  resolvePageSize,
  type PageSizeChoice,
} from '@/lib/media-pagination';
import type { MediaViewMode } from '@/lib/media-view-mode';

export function usePanelColumnCount(): number | null {
  const [columns, setColumns] = useState<number | null>(null);

  useEffect(() => {
    function update() {
      setColumns(panelColumnCount(window.innerWidth));
    }

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return columns;
}

export function useMediaPageSize(): [
  PageSizeChoice,
  (choice: PageSizeChoice) => void,
] {
  const [choice, setChoice] = useState<PageSizeChoice>('default');

  useEffect(() => {
    try {
      const stored = parseStoredPageSizeChoice(
        window.localStorage.getItem(MEDIA_PAGE_SIZE_STORAGE_KEY),
      );
      setChoice(stored);
    } catch {
      // Ignore storage access errors (private mode, etc.).
    }
  }, []);

  function updateChoice(next: PageSizeChoice) {
    setChoice(next);
    try {
      window.localStorage.setItem(MEDIA_PAGE_SIZE_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage write errors.
    }
  }

  return [choice, updateChoice];
}

type MediaPaginationProps = {
  meta: PaginationMeta;
  pageSizeChoice: PageSizeChoice;
  viewMode: MediaViewMode;
  columns: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (choice: PageSizeChoice) => void;
};

export function MediaPagination({
  meta,
  pageSizeChoice,
  viewMode,
  columns,
  onPageChange,
  onPageSizeChange,
}: MediaPaginationProps) {
  const pages = paginationItems(meta.page, meta.totalPages);
  const resolvedDefault = resolvePageSize('default', viewMode, columns);
  const defaultLabel =
    viewMode === 'list'
      ? `Default (${resolvedDefault})`
      : `Default (${resolvedDefault}, 2 rows)`;

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        {pageRangeLabel(meta.page, meta.pageSize || meta.total, meta.total)}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {meta.totalPages > 1 ? (
          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center gap-1"
          >
            <PageButton
              label="Previous"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            />
            {pages.map((item, index) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 text-sm text-muted"
                >
                  …
                </span>
              ) : (
                <PageButton
                  key={item}
                  label={String(item)}
                  active={item === meta.page}
                  onClick={() => onPageChange(item)}
                />
              ),
            )}
            <PageButton
              label="Next"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
            />
          </nav>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="whitespace-nowrap">Per page</span>
          <select
            value={String(pageSizeChoice)}
            aria-label="Titles per page"
            onChange={(event) => {
              const value = event.target.value;
              const next =
                value === PAGE_SIZE_ALL || value === 'default'
                  ? value
                  : Number(value);
              if (isPageSizeChoice(next)) {
                onPageSizeChange(next);
              }
            }}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2"
          >
            {PAGE_SIZE_CHOICES.map((choice) => (
              <option key={String(choice)} value={String(choice)}>
                {choice === 'default'
                  ? defaultLabel
                  : choice === PAGE_SIZE_ALL
                    ? 'All'
                    : String(choice)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function PageButton({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={[
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:pointer-events-none disabled:opacity-40',
        active
          ? 'bg-accent text-white'
          : 'border border-border bg-surface text-foreground hover:bg-[var(--overlay)]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

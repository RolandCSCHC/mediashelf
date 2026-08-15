'use client';

import { useEffect, useState } from 'react';
import type { PaginationMeta } from '@mediashelf/shared-types';
import { PAGE_SIZE_ALL } from '@mediashelf/shared-types';
import {
  PAGE_SIZE_CHOICES,
  MEDIA_PAGE_SIZE_STORAGE_KEY,
  isPageSizeChoice,
  pageRange,
  paginationItems,
  parseStoredPageSizeChoice,
  panelColumnCount,
  resolvePageSize,
  type PageSizeChoice,
} from '@/lib/media-pagination';
import type { MediaViewMode } from '@/lib/media-view-mode';
import { useI18n } from '@/components/locale-provider';

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
  const { t } = useI18n();
  const pages = paginationItems(meta.page, meta.totalPages);
  const resolvedDefault = resolvePageSize('default', viewMode, columns);
  const defaultLabel =
    viewMode === 'list'
      ? t('pagination.defaultList', { count: resolvedDefault })
      : t('pagination.defaultPanels', { count: resolvedDefault });
  const range = pageRange(meta.page, meta.pageSize || meta.total, meta.total);
  const rangeLabel =
    range.total === 0
      ? t('pagination.empty')
      : range.start === 1 && range.end === range.total
        ? range.total === 1
          ? t('pagination.totalOne', { count: range.total })
          : t('pagination.totalMany', { count: range.total })
        : t('pagination.range', {
            start: range.start,
            end: range.end,
            total: range.total,
          });

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{rangeLabel}</p>

      <div className="flex flex-wrap items-center gap-3">
        {meta.totalPages > 1 ? (
          <nav
            aria-label={t('pagination.aria')}
            className="flex flex-wrap items-center gap-1"
          >
            <PageButton
              label={t('pagination.previous')}
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
              label={t('pagination.next')}
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
            />
          </nav>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="whitespace-nowrap">{t('pagination.perPage')}</span>
          <select
            value={String(pageSizeChoice)}
            aria-label={t('pagination.perPageAria')}
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
                    ? t('common.all')
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

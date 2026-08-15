import { PAGE_SIZE_ALL, type PageSizeParam } from '@mediashelf/shared-types';
import type { MediaViewMode } from './media-view-mode';

export const MEDIA_PAGE_SIZE_STORAGE_KEY = 'mediashelf-page-size';
export const LIST_DEFAULT_PAGE_SIZE = 10;
export const PANEL_PAGE_ROWS = 2;

export const PAGE_SIZE_CHOICES = [
  'default',
  25,
  50,
  100,
  PAGE_SIZE_ALL,
] as const;

export type PageSizeChoice = (typeof PAGE_SIZE_CHOICES)[number];

const PANEL_COLUMN_BREAKPOINTS: { minWidth: number; columns: number }[] = [
  { minWidth: 1536, columns: 7 },
  { minWidth: 1280, columns: 6 },
  { minWidth: 1024, columns: 5 },
  { minWidth: 768, columns: 4 },
  { minWidth: 640, columns: 3 },
];

export function isPageSizeChoice(value: unknown): value is PageSizeChoice {
  return (
    value === 'default' ||
    value === PAGE_SIZE_ALL ||
    value === 25 ||
    value === 50 ||
    value === 100
  );
}

export function parseStoredPageSizeChoice(
  value: string | null,
): PageSizeChoice {
  if (value === 'default' || value === PAGE_SIZE_ALL) {
    return value;
  }
  if (value === '25' || value === '50' || value === '100') {
    return Number(value) as 25 | 50 | 100;
  }
  return 'default';
}

export function panelColumnCount(width: number): number {
  for (const breakpoint of PANEL_COLUMN_BREAKPOINTS) {
    if (width >= breakpoint.minWidth) {
      return breakpoint.columns;
    }
  }
  return 2;
}

export function resolvePageSize(
  choice: PageSizeChoice,
  viewMode: MediaViewMode,
  columns: number,
): PageSizeParam {
  if (choice !== 'default') {
    return choice;
  }
  if (viewMode === 'list') {
    return LIST_DEFAULT_PAGE_SIZE;
  }
  return columns * PANEL_PAGE_ROWS;
}

export function paginationItems(
  current: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  if (start > 2) {
    items.push('ellipsis');
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push('ellipsis');
  }

  items.push(totalPages);
  return items;
}

export function pageRange(
  page: number,
  pageSize: number,
  total: number,
): { start: number; end: number; total: number } {
  if (total === 0) {
    return { start: 0, end: 0, total: 0 };
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return { start, end, total };
}

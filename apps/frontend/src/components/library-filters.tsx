'use client';

import { useState } from 'react';
import type {
  CustomList,
  MediaStatus,
  MediaType,
} from '@mediashelf/shared-types';
import { MediaSortBy } from '@mediashelf/shared-types';
import { useI18n } from '@/components/locale-provider';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  DOWNLOADED_FILTER_OPTIONS,
  MEDIA_SORT_OPTIONS,
  MEDIA_STATUS_FILTER_OPTIONS,
  MEDIA_TYPE_FILTER_OPTIONS,
  RELEASED_FILTER_OPTIONS,
} from '@/lib/media-filters';

export type LibraryFiltersState = {
  status: '' | MediaStatus;
  type: '' | MediaType;
  genre: string;
  downloaded: '' | 'true' | 'false';
  released: '' | 'true' | 'false';
  listId: string;
  search: string;
  sortBy: MediaSortBy;
};

type LibraryFilterSortControlsProps = {
  value: LibraryFiltersState;
  genres: string[];
  lists?: CustomList[];
  showListFilter?: boolean;
  onChange: (next: LibraryFiltersState) => void;
  onResetFilters: () => void;
};

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-[var(--ring)] focus:ring-2';

export function LibraryFilterSortControls({
  value,
  genres,
  lists = [],
  showListFilter = true,
  onChange,
  onResetFilters,
}: LibraryFilterSortControlsProps) {
  const { t } = useI18n();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  function patch(partial: Partial<LibraryFiltersState>) {
    onChange({ ...value, ...partial });
  }

  const activeFilterCount = [
    value.status,
    value.type,
    value.genre,
    value.downloaded,
    value.released,
    ...(showListFilter ? [value.listId] : []),
  ].filter(Boolean).length;

  const sortLabel = t(
    MEDIA_SORT_OPTIONS.find((option) => option.value === value.sortBy)
      ?.labelKey ?? 'filters.sort',
  );

  return (
    <>
      <input
        type="search"
        value={value.search}
        onChange={(event) => patch({ search: event.target.value })}
        placeholder={t('filters.searchPlaceholder')}
        aria-label={t('filters.searchAria')}
        className="min-w-[10rem] flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none ring-[var(--ring)] placeholder:text-muted focus:ring-2 sm:max-w-[14rem] sm:flex-none"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsFilterOpen(true)}
      >
        {activeFilterCount > 0
          ? t('filters.filtersCount', { count: activeFilterCount })
          : t('filters.filters')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsSortOpen(true)}
      >
        {t('filters.sort')}
      </Button>

      <Modal
        open={isFilterOpen}
        title={t('filters.filters')}
        onClose={() => setIsFilterOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t('filters.status')}
            </span>
            <select
              value={value.status}
              onChange={(event) =>
                patch({
                  status: event.target.value as LibraryFiltersState['status'],
                })
              }
              className={fieldClass}
            >
              {MEDIA_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.labelKey} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t('filters.type')}
            </span>
            <select
              value={value.type}
              onChange={(event) =>
                patch({
                  type: event.target.value as LibraryFiltersState['type'],
                })
              }
              className={fieldClass}
            >
              {MEDIA_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.labelKey} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t('filters.genre')}
            </span>
            <select
              value={value.genre}
              onChange={(event) => patch({ genre: event.target.value })}
              className={fieldClass}
            >
              <option value="">{t('filters.allGenres')}</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t('filters.downloaded')}
            </span>
            <select
              value={value.downloaded}
              onChange={(event) =>
                patch({
                  downloaded: event.target
                    .value as LibraryFiltersState['downloaded'],
                })
              }
              className={fieldClass}
            >
              {DOWNLOADED_FILTER_OPTIONS.map((option) => (
                <option key={option.labelKey} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t('filters.release')}
            </span>
            <select
              value={value.released}
              onChange={(event) =>
                patch({
                  released: event.target
                    .value as LibraryFiltersState['released'],
                })
              }
              className={fieldClass}
            >
              {RELEASED_FILTER_OPTIONS.map((option) => (
                <option key={option.labelKey} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          {showListFilter ? (
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-wide text-muted">
                {t('filters.customList')}
              </span>
              <select
                value={value.listId}
                onChange={(event) => patch({ listId: event.target.value })}
                className={fieldClass}
              >
                <option value="">{t('filters.allLists')}</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onResetFilters();
              }}
              disabled={activeFilterCount === 0}
            >
              {t('filters.reset')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsFilterOpen(false)}
            >
              {t('common.done')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isSortOpen}
        title={t('filters.sort')}
        onClose={() => setIsSortOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t('filters.sortBy')}
            </span>
            <select
              value={value.sortBy}
              onChange={(event) =>
                patch({ sortBy: event.target.value as MediaSortBy })
              }
              className={fieldClass}
            >
              {MEDIA_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <p className="text-sm text-muted">
            {t('filters.currentlySorting', { sort: sortLabel })}
          </p>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsSortOpen(false)}
            >
              {t('common.done')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFiltersState = {
  status: '',
  type: '',
  genre: '',
  downloaded: '',
  released: '',
  listId: '',
  search: '',
  sortBy: MediaSortBy.TITLE,
};

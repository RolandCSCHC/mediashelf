'use client';

import { useState } from 'react';
import type {
  CustomList,
  MediaStatus,
  MediaType,
} from '@mediashelf/shared-types';
import { MediaSortBy } from '@mediashelf/shared-types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  DOWNLOADED_FILTER_OPTIONS,
  MEDIA_SORT_OPTIONS,
  MEDIA_STATUS_FILTER_OPTIONS,
  MEDIA_TYPE_FILTER_OPTIONS,
} from '@/lib/media-filters';

export type LibraryFiltersState = {
  status: '' | MediaStatus;
  type: '' | MediaType;
  genre: string;
  downloaded: '' | 'true' | 'false';
  listId: string;
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
    ...(showListFilter ? [value.listId] : []),
  ].filter(Boolean).length;

  const sortLabel =
    MEDIA_SORT_OPTIONS.find((option) => option.value === value.sortBy)?.label ??
    'Sort';

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsFilterOpen(true)}
      >
        {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsSortOpen(true)}
      >
        Sort
      </Button>

      <Modal
        open={isFilterOpen}
        title="Filters"
        onClose={() => setIsFilterOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              Status
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
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              Type
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
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              Genre
            </span>
            <select
              value={value.genre}
              onChange={(event) => patch({ genre: event.target.value })}
              className={fieldClass}
            >
              <option value="">All genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              Downloaded
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
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {showListFilter ? (
            <label className="block space-y-1.5">
              <span className="text-xs uppercase tracking-wide text-muted">
                Custom list
              </span>
              <select
                value={value.listId}
                onChange={(event) => patch({ listId: event.target.value })}
                className={fieldClass}
              >
                <option value="">All lists</option>
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
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsFilterOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isSortOpen}
        title="Sort"
        onClose={() => setIsSortOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">
              Sort by
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
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <p className="text-sm text-muted">
            Currently sorting by {sortLabel.toLowerCase()}.
          </p>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsSortOpen(false)}
            >
              Done
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
  listId: '',
  sortBy: MediaSortBy.DATE_ADDED,
};

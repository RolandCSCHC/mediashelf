'use client';

import { useEffect, useRef } from 'react';
import {
  REFRESH_LAST_AIR_DATES_MAX,
  type MediaItem,
} from '@mediashelf/shared-types';
import { refreshLastAirDates } from '@/lib/api';

const attemptedIds = new Set<string>();

function staleSeriesIds(items: MediaItem[]): string[] {
  return items
    .filter(
      (item) =>
        item.type === 'SERIES' &&
        item.tmdbId != null &&
        item.lastAirDate == null,
    )
    .map((item) => item.id);
}

/** Backfill last episode air dates for visible TMDB series missing that field. */
export function useRefreshLastAirDates(
  items: MediaItem[],
  onUpdated: (item: MediaItem) => void,
): void {
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;

  const staleKey = staleSeriesIds(items).sort().join(',');

  useEffect(() => {
    if (!staleKey) {
      return;
    }

    let cancelled = false;

    async function refreshStale() {
      const queue = staleSeriesIds(itemsRef.current).filter(
        (id) => !attemptedIds.has(id),
      );

      for (
        let index = 0;
        index < queue.length;
        index += REFRESH_LAST_AIR_DATES_MAX
      ) {
        if (cancelled) {
          return;
        }

        const batch = queue.slice(index, index + REFRESH_LAST_AIR_DATES_MAX);
        for (const id of batch) {
          attemptedIds.add(id);
        }

        try {
          const response = await refreshLastAirDates({ mediaItemIds: batch });
          if (cancelled) {
            return;
          }
          for (const item of response.items) {
            onUpdatedRef.current(item);
          }
        } catch {
          for (const id of batch) {
            attemptedIds.delete(id);
          }
          return;
        }
      }
    }

    void refreshStale();

    return () => {
      cancelled = true;
    };
  }, [staleKey]);
}

'use client';

import { useEffect, useState } from 'react';
import type { MediaType, TmdbTitleDetails } from '@mediashelf/shared-types';
import { TmdbTitleCredits } from '@/components/tmdb-title-credits';
import { getTmdbTitle } from '@/lib/api';

type LibraryTmdbCreditsProps = {
  tmdbId: number;
  type: MediaType;
};

export function LibraryTmdbCredits({ tmdbId, type }: LibraryTmdbCreditsProps) {
  const [details, setDetails] = useState<TmdbTitleDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getTmdbTitle(type, tmdbId)
      .then((title) => {
        if (!cancelled) {
          setDetails(title);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetails(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tmdbId, type]);

  if (!details) {
    return null;
  }

  return <TmdbTitleCredits details={details} />;
}

'use client';

import type { TmdbTitleDetails } from '@mediashelf/shared-types';
import { TmdbPersonList } from '@/components/tmdb-person-list';
import { useI18n } from '@/components/locale-provider';

type TmdbTitleCreditsProps = {
  details: TmdbTitleDetails;
};

export function TmdbTitleCredits({ details }: TmdbTitleCreditsProps) {
  const { t } = useI18n();

  return (
    <>
      <TmdbPersonList title={t('tmdb.directors')} people={details.directors} />
      <TmdbPersonList title={t('tmdb.createdBy')} people={details.creators} />
      <TmdbPersonList title={t('tmdb.cast')} people={details.cast} />
    </>
  );
}

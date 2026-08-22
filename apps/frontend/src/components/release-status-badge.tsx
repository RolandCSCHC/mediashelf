'use client';

import { releaseAvailability } from '@mediashelf/shared-types';
import { useI18n } from '@/components/locale-provider';

type ReleaseStatusBadgeProps = {
  item: {
    type: 'MOVIE' | 'SERIES';
    releaseDate: string | null;
    lastAirDate?: string | null;
  };
  size?: 'sm' | 'md';
  className?: string;
};

export function ReleaseStatusBadge({
  item,
  size = 'sm',
  className,
}: ReleaseStatusBadgeProps) {
  const { t } = useI18n();
  const availability = releaseAvailability(item);

  if (!availability) {
    return null;
  }

  const out = availability === 'out';
  const classes = [
    'inline-block shrink-0 whitespace-nowrap rounded font-semibold uppercase tracking-wide',
    size === 'md' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[10px]',
    out ? 'bg-accent text-background' : 'bg-danger text-background',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {out ? t('common.outNow') : t('common.notOutYet')}
    </span>
  );
}

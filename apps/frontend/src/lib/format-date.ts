import type { Locale } from '@/i18n';
import { dateLocale } from '@/i18n';

const CALENDAR_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export function formatCalendarDate(
  iso: string | null | undefined,
  locale: Locale,
): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(dateLocale(locale), CALENDAR_DATE_FORMAT);
}

export function formatCalendarYear(
  iso: string | null | undefined,
): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return String(date.getUTCFullYear());
}

type ReleaseDateSource = {
  releaseDate: string | null;
  lastAirDate?: string | null;
  tmdbId?: number | null;
};

/**
 * Full day/month/year for TMDB titles; year only for manual entries.
 * Series prefer last episode air date when it is available.
 */
export function formatReleaseLabel(
  source: ReleaseDateSource,
  locale: Locale,
): string | null {
  if (source.tmdbId === null) {
    return formatCalendarYear(source.releaseDate);
  }

  return (
    formatCalendarDate(source.lastAirDate, locale) ??
    formatCalendarDate(source.releaseDate, locale)
  );
}

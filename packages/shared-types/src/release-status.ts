/** Start of the next UTC calendar day (exclusive upper bound for “has aired”). */
export function startOfTomorrowUtc(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
}

export function relevantAirDate(item: {
  type: 'MOVIE' | 'SERIES';
  releaseDate: string | null;
  lastAirDate?: string | null;
}): string | null {
  if (item.type === 'SERIES') {
    return item.lastAirDate ?? item.releaseDate;
  }
  return item.releaseDate;
}

export function hasDateArrived(
  iso: string | null | undefined,
  now = new Date(),
): boolean {
  if (!iso) {
    return false;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date < startOfTomorrowUtc(now);
}

/** Upcoming titles whose movie release / last episode date is today or earlier. */
export function isReleasedUpcoming(
  item: {
    type: 'MOVIE' | 'SERIES';
    releaseDate: string | null;
    lastAirDate?: string | null;
  },
  status: string,
  now = new Date(),
): boolean {
  return status === 'UPCOMING' && hasDateArrived(relevantAirDate(item), now);
}

export type ReleaseAvailability = 'out' | 'upcoming' | null;

/** Date-only availability for badges (ignores watch status). */
export function releaseAvailability(
  item: {
    type: 'MOVIE' | 'SERIES';
    releaseDate: string | null;
    lastAirDate?: string | null;
  },
  now = new Date(),
): ReleaseAvailability {
  const iso = relevantAirDate(item);
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return hasDateArrived(iso, now) ? 'out' : 'upcoming';
}

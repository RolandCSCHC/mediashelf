import { MediaStatus } from '@mediashelf/shared-types';
import type { MessageKey } from '@/i18n';

export const MEDIA_STATUS_OPTIONS: {
  value: MediaStatus;
  labelKey: MessageKey;
}[] = [
  { value: MediaStatus.WATCHLIST, labelKey: 'status.watchlist' },
  { value: MediaStatus.WATCHING, labelKey: 'status.watching' },
  { value: MediaStatus.WATCHED, labelKey: 'status.watched' },
  { value: MediaStatus.UPCOMING, labelKey: 'status.upcoming' },
];

export function mediaStatusLabelKey(status: MediaStatus): MessageKey {
  return (
    MEDIA_STATUS_OPTIONS.find((option) => option.value === status)?.labelKey ??
    'status.watchlist'
  );
}

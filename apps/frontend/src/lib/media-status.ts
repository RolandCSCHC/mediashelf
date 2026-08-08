import { MediaStatus } from '@mediashelf/shared-types';

export const MEDIA_STATUS_OPTIONS: {
  value: MediaStatus;
  label: string;
}[] = [
  { value: MediaStatus.WATCHLIST, label: 'Watchlist' },
  { value: MediaStatus.WATCHING, label: 'Watching' },
  { value: MediaStatus.WATCHED, label: 'Watched' },
  { value: MediaStatus.FUTURE, label: 'Future' },
];

export function formatMediaStatus(status: MediaStatus): string {
  return (
    MEDIA_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

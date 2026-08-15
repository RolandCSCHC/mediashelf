import { MediaStatus } from '@mediashelf/shared-types';

export function resolveMembershipStatus(
  defaultStatus: MediaStatus | null,
  fallback: MediaStatus,
): MediaStatus {
  return defaultStatus ?? fallback;
}

export function resolveMembershipDownloaded(
  defaultDownloaded: boolean | null,
  fallback: boolean,
): boolean {
  return defaultDownloaded ?? fallback;
}

import type { CustomList } from '@mediashelf/shared-types';
import { formatMediaStatus } from '@/lib/media-status';

export function formatListStateSummary(
  list: Pick<CustomList, 'defaultStatus' | 'defaultDownloaded'>,
): string | null {
  const parts: string[] = [];

  if (list.defaultStatus) {
    parts.push(formatMediaStatus(list.defaultStatus));
  }
  if (list.defaultDownloaded === true) {
    parts.push('Downloaded');
  } else if (list.defaultDownloaded === false) {
    parts.push('Not downloaded');
  }

  if (parts.length === 0) {
    return null;
  }

  return `Sets ${parts.join(' · ')}`;
}

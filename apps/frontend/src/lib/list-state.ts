import type { CustomList } from '@mediashelf/shared-types';
import type { TranslateFn } from '@/i18n';
import { mediaStatusLabelKey } from '@/lib/media-status';

export function formatListStateSummary(
  list: Pick<CustomList, 'defaultStatus' | 'defaultDownloaded'>,
  t: TranslateFn,
): string | null {
  const parts: string[] = [];

  if (list.defaultStatus) {
    parts.push(t(mediaStatusLabelKey(list.defaultStatus)));
  }
  if (list.defaultDownloaded === true) {
    parts.push(t('common.downloaded'));
  } else if (list.defaultDownloaded === false) {
    parts.push(t('common.notDownloaded'));
  }

  if (parts.length === 0) {
    return null;
  }

  return t('lists.setsState', { parts: parts.join(' · ') });
}

'use client';

import { useSyncExternalStore } from 'react';
import { useI18n } from '@/components/locale-provider';
import { Button } from '@/components/ui/button';
import type { MessageKey } from '@/i18n';
import {
  dismissTip,
  isTipDismissed,
  subscribeDismissedTips,
  type ViewTipId,
} from '@/lib/view-tips';

const TIP_MESSAGE: Record<ViewTipId, MessageKey> = {
  library: 'tips.library',
  search: 'tips.search',
  lists: 'tips.lists',
  'list-detail': 'tips.listDetail',
  backup: 'tips.backup',
};

type ViewTipProps = {
  id: ViewTipId;
};

export function ViewTip({ id }: ViewTipProps) {
  const { t } = useI18n();
  const dismissed = useSyncExternalStore(
    subscribeDismissedTips,
    () => isTipDismissed(id),
    () => true,
  );

  if (dismissed) {
    return null;
  }

  return (
    <aside
      className="mt-6 flex flex-col gap-3 rounded-lg border border-border border-l-4 border-l-accent bg-surface/80 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
      role="note"
      aria-label={t('tips.label')}
    >
      <p className="text-sm leading-relaxed text-muted">{t(TIP_MESSAGE[id])}</p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0 self-end sm:self-start"
        onClick={() => dismissTip(id)}
      >
        {t('tips.gotIt')}
      </Button>
    </aside>
  );
}

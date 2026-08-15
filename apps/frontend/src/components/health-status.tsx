'use client';

import type { HealthResponse } from '@mediashelf/shared-types';
import { useI18n } from '@/components/locale-provider';

type HealthStatusProps = {
  health: HealthResponse | null;
  compact?: boolean;
};

export function HealthStatus({ health, compact = false }: HealthStatusProps) {
  const { t } = useI18n();

  if (!health) {
    return (
      <p className="text-sm text-muted">
        {compact ? t('health.apiUnreachable') : t('health.dockerHint')}
      </p>
    );
  }

  const isHealthy = health.status === 'ok' && health.database === 'up';

  if (compact) {
    return (
      <p className="text-sm text-muted">
        {t('health.api')}{' '}
        <span className={isHealthy ? 'text-accent' : 'text-danger'}>
          {health.status}
        </span>
        <span className="mx-1.5 text-border">·</span>
        {t('health.db')}{' '}
        <span
          className={health.database === 'up' ? 'text-accent' : 'text-danger'}
        >
          {health.database}
        </span>
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4">
      <p className="text-sm font-medium text-foreground">
        {t('health.apiStatus')}
      </p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 sm:block">
          <dt className="text-muted">{t('health.service')}</dt>
          <dd className={isHealthy ? 'text-accent' : 'text-danger'}>
            {health.status}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 sm:block">
          <dt className="text-muted">{t('health.database')}</dt>
          <dd
            className={health.database === 'up' ? 'text-accent' : 'text-danger'}
          >
            {health.database}
          </dd>
        </div>
      </dl>
    </div>
  );
}

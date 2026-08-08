import type { HealthResponse } from '@mediashelf/shared-types';

type HealthStatusProps = {
  health: HealthResponse | null;
  compact?: boolean;
};

export function HealthStatus({ health, compact = false }: HealthStatusProps) {
  if (!health) {
    return (
      <p className="text-sm text-muted">
        {compact
          ? 'API unreachable'
          : 'Unable to reach the backend. Is Docker Compose running?'}
      </p>
    );
  }

  const isHealthy = health.status === 'ok' && health.database === 'up';

  if (compact) {
    return (
      <p className="text-sm text-muted">
        API{' '}
        <span className={isHealthy ? 'text-accent' : 'text-danger'}>
          {health.status}
        </span>
        <span className="mx-1.5 text-border">·</span>
        DB{' '}
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
      <p className="text-sm font-medium text-foreground">API status</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 sm:block">
          <dt className="text-muted">Service</dt>
          <dd className={isHealthy ? 'text-accent' : 'text-danger'}>
            {health.status}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 sm:block">
          <dt className="text-muted">Database</dt>
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

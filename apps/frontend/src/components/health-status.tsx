import type { HealthResponse } from '@mediashelf/shared-types';

type HealthStatusProps = {
  health: HealthResponse | null;
};

export function HealthStatus({ health }: HealthStatusProps) {
  if (!health) {
    return (
      <div className="rounded-lg border border-border bg-surface px-5 py-4">
        <p className="text-sm font-medium text-foreground">API status</p>
        <p className="mt-1 text-sm text-muted">
          Unable to reach the backend. Is Docker Compose running?
        </p>
      </div>
    );
  }

  const isHealthy = health.status === 'ok' && health.database === 'up';

  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4">
      <p className="text-sm font-medium text-foreground">API status</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 sm:block">
          <dt className="text-muted">Service</dt>
          <dd className={isHealthy ? 'text-accent' : 'text-red-400'}>
            {health.status}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 sm:block">
          <dt className="text-muted">Database</dt>
          <dd className={health.database === 'up' ? 'text-accent' : 'text-red-400'}>
            {health.database}
          </dd>
        </div>
      </dl>
    </div>
  );
}

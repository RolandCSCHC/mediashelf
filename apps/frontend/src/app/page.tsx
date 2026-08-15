import type { HealthResponse } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { GuestGuard } from '@/components/guest-guard';
import { HealthStatus } from '@/components/health-status';
import { HomeHero } from '@/components/home-hero';

async function fetchHealth(): Promise<HealthResponse | null> {
  // Server components call Nest directly (Docker internal URL or localhost).
  // Do not use NEXT_PUBLIC_API_URL=/api here — that path is browser-only.
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl =
    process.env.API_URL ??
    (publicApiUrl?.startsWith('http') ? publicApiUrl : undefined) ??
    'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/health`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await fetchHealth();

  return (
    <GuestGuard>
      <AppShell center footer={<HealthStatus health={health} compact />}>
        <HomeHero />
      </AppShell>
    </GuestGuard>
  );
}

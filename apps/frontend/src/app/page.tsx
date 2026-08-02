import type { HealthResponse } from '@mediashelf/shared-types';
import { HealthStatus } from '@/components/health-status';

async function fetchHealth(): Promise<HealthResponse | null> {
  // API_URL is for server-side (Docker internal network); NEXT_PUBLIC_* for the browser
  const apiUrl =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
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
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(61,154,139,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(42,53,66,0.9),_transparent_50%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-muted">
          Portfolio foundation
        </p>
        <h1 className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          MediaShelf
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Track movies and TV series in a private library — Phase 1 is online
          when the API and database report healthy.
        </p>

        <div className="mt-10">
          <HealthStatus health={health} />
        </div>
      </div>
    </main>
  );
}

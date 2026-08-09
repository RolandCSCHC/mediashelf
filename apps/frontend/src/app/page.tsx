import type { HealthResponse } from '@mediashelf/shared-types';
import { AppShell } from '@/components/app-shell';
import { GoogleLoginButton } from '@/components/google-login-button';
import { HealthStatus } from '@/components/health-status';
import { ButtonLink } from '@/components/ui/button';

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
    <AppShell center footer={<HealthStatus health={health} compact />}>
      <p className="ms-animate-fade-up mb-3 text-sm uppercase tracking-[0.2em] text-muted">
        Your private media library
      </p>
      <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
        MediaShelf
      </h1>
      <p className="ms-animate-fade-up ms-animate-delay-2 mt-4 max-w-xl text-lg text-muted">
        Track movies and TV series in one place. Sign in with Google to open
        your private library.
      </p>

      <div className="ms-animate-fade-up ms-animate-delay-3 mt-8 flex flex-wrap items-center gap-3">
        <GoogleLoginButton />
        <ButtonLink href="/library" variant="ghost" size="md">
          Go to library
        </ButtonLink>
      </div>
    </AppShell>
  );
}

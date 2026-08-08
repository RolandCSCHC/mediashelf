'use client';

import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/components/auth-provider';

function LibraryContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0];

  return (
    <AppShell>
      <p className="ms-animate-fade-up mb-2 text-sm uppercase tracking-[0.2em] text-muted">
        Private library
      </p>
      <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Welcome{firstName ? `, ${firstName}` : ''}
      </h1>
      <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 max-w-xl text-muted">
        You&apos;re signed in. Search and shelves arrive next — for now this
        space is locked to your account.
      </p>

      <div className="ms-animate-fade-up ms-animate-delay-3 mt-10 flex flex-wrap items-center gap-3">
        {user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.picture}
            alt=""
            className="h-10 w-10 rounded-full border border-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-accent"
          >
            {(user?.name ?? user?.email ?? '?').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {user?.name ?? 'Signed in'}
          </p>
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      <div className="ms-animate-fade-up ms-animate-delay-3 mt-12 rounded-lg border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
        <p className="font-display text-xl text-foreground">
          Your shelf is empty
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Movies and series will land here once TMDB search and library CRUD are
          wired up.
        </p>
      </div>
    </AppShell>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard>
      <LibraryContent />
    </AuthGuard>
  );
}

'use client';

import { AuthGuard } from '@/components/auth-guard';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/auth-provider';

function LibraryContent() {
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(61,154,139,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(42,53,66,0.85),_transparent_50%)]"
      />

      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-muted">
          Private library
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
          Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          You are signed in as {user?.email}. Media CRUD arrives in Phase 4 —
          for now this route is protected and tied to your account.
        </p>

        <dl className="mt-10 grid gap-4 rounded-lg border border-border bg-surface px-5 py-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Account</dt>
            <dd className="mt-1 text-foreground">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-muted">User ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-foreground">
              {user?.id}
            </dd>
          </div>
        </dl>
      </main>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard>
      <LibraryContent />
    </AuthGuard>
  );
}

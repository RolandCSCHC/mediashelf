'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { GoogleLoginButton } from '@/components/google-login-button';

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="relative z-10 border-b border-border/60">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-foreground"
        >
          MediaShelf
        </Link>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <span className="text-sm text-muted">…</span>
          ) : user ? (
            <>
              <Link
                href="/library"
                className="text-sm text-muted transition hover:text-foreground"
              >
                Library
              </Link>
              <div className="flex items-center gap-2">
                {user.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.picture}
                    alt=""
                    className="h-8 w-8 rounded-full border border-border"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <span className="hidden text-sm text-muted sm:inline">
                  {user.name ?? user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-surface"
              >
                Log out
              </button>
            </>
          ) : (
            <GoogleLoginButton
              label="Log in"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-surface"
            />
          )}
        </div>
      </div>
    </header>
  );
}

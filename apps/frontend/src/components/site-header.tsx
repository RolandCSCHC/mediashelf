'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { GoogleLoginButton } from '@/components/google-login-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="border-b border-border/60 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-3.5">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground transition hover:text-accent sm:text-xl"
        >
          MediaShelf
        </Link>

        <nav
          aria-label="Primary"
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <ThemeToggle />

          {isLoading ? (
            <span className="text-sm text-muted" aria-live="polite">
              …
            </span>
          ) : user ? (
            <>
              <Link
                href="/library"
                className="hidden text-sm text-muted transition hover:text-foreground sm:inline"
              >
                Library
              </Link>
              <div className="flex min-w-0 items-center gap-2">
                {user.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.picture}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full border border-border"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <span className="hidden max-w-[10rem] truncate text-sm text-muted md:inline">
                  {user.name ?? user.email}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleLogout()}
              >
                Log out
              </Button>
            </>
          ) : (
            <GoogleLoginButton label="Log in" variant="secondary" size="sm" />
          )}
        </nav>
      </div>
    </header>
  );
}

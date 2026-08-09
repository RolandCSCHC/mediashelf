'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { GoogleLoginButton } from '@/components/google-login-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '/library', label: 'Library' },
  { href: '/lists', label: 'Lists' },
  { href: '/search', label: 'Search TMDB' },
] as const;

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push('/');
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (
        target &&
        !menuPanelRef.current?.contains(target) &&
        !menuButtonRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [menuOpen]);

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
              <div className="hidden items-center gap-3 sm:flex">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted transition hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

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
                className="hidden sm:inline-flex"
                onClick={() => void handleLogout()}
              >
                Log out
              </Button>

              <Button
                ref={menuButtonRef}
                type="button"
                variant="secondary"
                size="sm"
                className="px-2.5 sm:hidden"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span aria-hidden className="flex h-4 w-4 flex-col justify-center gap-1">
                  <span
                    className={[
                      'block h-0.5 w-full rounded-full bg-current transition',
                      menuOpen ? 'translate-y-[6px] rotate-45' : '',
                    ].join(' ')}
                  />
                  <span
                    className={[
                      'block h-0.5 w-full rounded-full bg-current transition',
                      menuOpen ? 'opacity-0' : '',
                    ].join(' ')}
                  />
                  <span
                    className={[
                      'block h-0.5 w-full rounded-full bg-current transition',
                      menuOpen ? '-translate-y-[6px] -rotate-45' : '',
                    ].join(' ')}
                  />
                </span>
              </Button>
            </>
          ) : (
            <GoogleLoginButton label="Log in" variant="secondary" size="sm" />
          )}
        </nav>
      </div>

      {user && menuOpen ? (
        <div
          ref={menuPanelRef}
          id={menuId}
          className="border-t border-border/60 bg-surface/95 sm:hidden"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-6 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm text-foreground transition hover:bg-[var(--overlay)]"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              className="rounded-md px-3 py-2.5 text-left text-sm text-muted transition hover:bg-[var(--overlay)] hover:text-foreground"
              onClick={() => void handleLogout()}
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

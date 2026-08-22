'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { LanguageToggle } from '@/components/language-toggle';
import { useI18n } from '@/components/locale-provider';
import { RestoreTipsButton } from '@/components/restore-tips-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button, ButtonLink } from '@/components/ui/button';
import type { MessageKey } from '@/i18n';

const NAV_LINKS: { href: string; labelKey: MessageKey }[] = [
  { href: '/library', labelKey: 'nav.library' },
  { href: '/lists', labelKey: 'nav.lists' },
  { href: '/search', labelKey: 'nav.search' },
];

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const { t } = useI18n();
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
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-6 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground transition hover:text-accent sm:gap-2.5 sm:text-xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={32}
            height={32}
            className="size-7 shrink-0 sm:size-8"
            aria-hidden
          />
          MediaShelf
        </Link>

        <nav
          aria-label={t('nav.primary')}
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <LanguageToggle />
          <ThemeToggle />
          {user ? <RestoreTipsButton /> : null}

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
                    {t(link.labelKey)}
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
                {t('nav.logout')}
              </Button>

              <Button
                ref={menuButtonRef}
                type="button"
                variant="secondary"
                size="sm"
                className="px-2.5 sm:hidden"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span
                  aria-hidden
                  className="flex h-4 w-4 flex-col justify-center gap-1"
                >
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
            <ButtonLink href="/login" variant="secondary" size="sm">
              {t('nav.login')}
            </ButtonLink>
          )}
        </nav>
      </div>

      {user && menuOpen ? (
        <div
          ref={menuPanelRef}
          id={menuId}
          className="border-t border-border/60 bg-surface/95 sm:hidden"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-6 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm text-foreground transition hover:bg-[var(--overlay)]"
                onClick={() => setMenuOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <button
              type="button"
              className="rounded-md px-3 py-2.5 text-left text-sm text-muted transition hover:bg-[var(--overlay)] hover:text-foreground"
              onClick={() => void handleLogout()}
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

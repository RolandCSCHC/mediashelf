'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/components/locale-provider';
import type { Locale } from '@/i18n';

const OPTIONS: {
  locale: Locale;
  labelKey: 'language.english' | 'language.spanish';
}[] = [
  { locale: 'en', labelKey: 'language.english' },
  { locale: 'es', labelKey: 'language.spanish' },
];

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && !rootRef.current?.contains(target)) {
        setOpen(false);
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
  }, [open]);

  function selectLocale(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('language.choose')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        title={t('language.choose')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-foreground transition hover:bg-[var(--overlay)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        <FlagBadge locale={locale} />
      </button>

      {open ? (
        <ul
          id={menuId}
          role="listbox"
          aria-label={t('language.choose')}
          className="absolute right-0 z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {OPTIONS.map((option) => {
            const selected = option.locale === locale;

            return (
              <li key={option.locale} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    selectLocale(option.locale);
                  }}
                  className={[
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition',
                    selected
                      ? 'bg-[var(--overlay)] text-foreground'
                      : 'text-muted hover:bg-[var(--overlay)] hover:text-foreground',
                  ].join(' ')}
                >
                  <FlagBadge locale={option.locale} />
                  {t(option.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function FlagBadge({ locale }: { locale: Locale }) {
  return (
    <span className="overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.18)]">
      {locale === 'es' ? (
        <SpainFlag className="block h-3.5 w-[21px]" />
      ) : (
        <UnitedKingdomFlag className="block h-3.5 w-[21px]" />
      )}
    </span>
  );
}

function SpainFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 14" aria-hidden>
      <rect width="21" height="14" fill="#c60b1e" />
      <rect y="3.5" width="21" height="7" fill="#ffc400" />
    </svg>
  );
}

function UnitedKingdomFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 14" aria-hidden>
      <rect width="21" height="14" fill="#012169" />
      <path d="M0 0 L21 14 M21 0 L0 14" stroke="#fff" strokeWidth="3" />
      <path d="M0 0 L21 14 M21 0 L0 14" stroke="#c8102e" strokeWidth="1.4" />
      <path d="M10.5 0 V14 M0 7 H21" stroke="#fff" strokeWidth="4.6" />
      <path d="M10.5 0 V14 M0 7 H21" stroke="#c8102e" strokeWidth="2.6" />
    </svg>
  );
}

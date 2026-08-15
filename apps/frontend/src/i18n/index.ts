import { en } from './en';
import { es } from './es';
import type { MessageKey, Messages, TranslateVars } from './types';

export type { MessageKey, Messages, TranslateFn, TranslateVars } from './types';

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'mediashelf-locale';
export const LOCALE_STORAGE_KEY = 'mediashelf-locale';

export const messagesByLocale: Record<Locale, Messages> = { en, es };

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'es';
}

export function parseLocale(value: string | undefined | null): Locale {
  return value === 'es' ? 'es' : DEFAULT_LOCALE;
}

export function htmlLang(locale: Locale): string {
  return locale;
}

export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export function getMessage(messages: Messages, key: MessageKey): string {
  const parts = key.split('.');
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : key;
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: TranslateVars,
): string {
  return interpolate(getMessage(messagesByLocale[locale], key), vars);
}

export function dateLocale(locale: Locale): string {
  return locale === 'es' ? 'es' : 'en';
}

'use client';

import { LoginButtons } from '@/components/oauth-login-buttons';
import { useI18n } from '@/components/locale-provider';

export function HomeHero() {
  const { t } = useI18n();

  return (
    <>
      <p className="ms-animate-fade-up mb-3 text-sm uppercase tracking-[0.2em] text-muted">
        {t('home.kicker')}
      </p>
      <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
        MediaShelf
      </h1>
      <p className="ms-animate-fade-up ms-animate-delay-2 mt-4 max-w-xl text-lg text-muted">
        {t('home.description')}
      </p>

      <div className="ms-animate-fade-up ms-animate-delay-3 mt-8">
        <LoginButtons />
      </div>
    </>
  );
}

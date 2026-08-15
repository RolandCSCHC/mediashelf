'use client';

import { GoogleLoginButton } from '@/components/google-login-button';
import { useI18n } from '@/components/locale-provider';

export function LoginHero() {
  const { t } = useI18n();

  return (
    <>
      <p className="ms-animate-fade-up mb-3 text-sm uppercase tracking-[0.2em] text-muted">
        {t('login.kicker')}
      </p>
      <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {t('login.title')}
      </h1>
      <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 text-muted">
        {t('login.description')}
      </p>

      <div className="ms-animate-fade-up ms-animate-delay-3 mt-8">
        <GoogleLoginButton className="w-full sm:w-auto" />
      </div>
    </>
  );
}

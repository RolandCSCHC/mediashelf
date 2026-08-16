'use client';

import type { ReactNode } from 'react';
import { getGoogleLoginUrl, getMicrosoftLoginUrl } from '@/lib/api';
import { useApiReady, type ApiReadyState } from '@/hooks/use-api-ready';
import { useI18n } from '@/components/locale-provider';
import { Button, ButtonLink } from '@/components/ui/button';

type OAuthLoginButtonProps = {
  href: string;
  className?: string;
  label: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  state: ApiReadyState;
  retry: () => void;
  glyph: ReactNode;
};

function OAuthLoginButton({
  href,
  className,
  label,
  variant = 'primary',
  size = 'md',
  state,
  retry,
  glyph,
}: OAuthLoginButtonProps) {
  const { t } = useI18n();

  if (state === 'ready') {
    return (
      <ButtonLink
        href={href}
        variant={variant}
        size={size}
        className={className}
      >
        {glyph}
        {label}
      </ButtonLink>
    );
  }

  if (state === 'error') {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={retry}
      >
        {glyph}
        {size === 'sm' ? t('oauth.retryShort') : t('oauth.retry')}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled
      aria-busy="true"
      aria-live="polite"
    >
      <Spinner className="h-4 w-4" />
      {size === 'sm' ? t('oauth.connectingShort') : t('oauth.connecting')}
    </Button>
  );
}

type LoginButtonsProps = {
  className?: string;
};

export function LoginButtons({ className }: LoginButtonsProps) {
  const { t } = useI18n();
  const { state, retry } = useApiReady();

  return (
    <div
      className={['flex flex-col gap-3 sm:flex-row sm:items-center', className]
        .filter(Boolean)
        .join(' ')}
    >
      <OAuthLoginButton
        href={getGoogleLoginUrl()}
        className="w-full sm:w-auto"
        label={t('google.continue')}
        variant="primary"
        state={state}
        retry={retry}
        glyph={<GoogleGlyph className="h-4 w-4" />}
      />
      <OAuthLoginButton
        href={getMicrosoftLoginUrl()}
        className="w-full sm:w-auto"
        label={t('microsoft.continue')}
        variant="secondary"
        state={state}
        retry={retry}
        glyph={<MicrosoftGlyph className="h-4 w-4" />}
      />
    </div>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ''}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.18v2.98h5.27c-.23 1.25-1.5 3.66-5.27 3.66-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.86 3.55 14.93 2.6 12.17 2.6 7.03 2.6 2.86 6.8 2.86 11.9s4.17 9.3 9.31 9.3c5.38 0 8.94-3.78 8.94-9.1 0-.61-.07-1.07-.16-1.5z"
      />
    </svg>
  );
}

function MicrosoftGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M3 3h8.5v8.5H3V3zm9.5 0H21v8.5h-8.5V3zM3 12.5H11.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z"
      />
    </svg>
  );
}

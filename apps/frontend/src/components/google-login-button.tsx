'use client';

import { getGoogleLoginUrl } from '@/lib/api';
import { useApiReady } from '@/hooks/use-api-ready';
import { Button, ButtonLink } from '@/components/ui/button';

type GoogleLoginButtonProps = {
  className?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
};

export function GoogleLoginButton({
  className,
  label = 'Continue with Google',
  variant = 'primary',
  size = 'md',
}: GoogleLoginButtonProps) {
  const { state, retry } = useApiReady();

  if (state === 'ready') {
    return (
      <ButtonLink
        href={getGoogleLoginUrl()}
        variant={variant}
        size={size}
        className={className}
      >
        <GoogleGlyph className="h-4 w-4" />
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
        <GoogleGlyph className="h-4 w-4" />
        {size === 'sm' ? 'Retry' : 'Server unavailable — Retry'}
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
      {size === 'sm' ? 'Connecting…' : 'Waking server…'}
    </Button>
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

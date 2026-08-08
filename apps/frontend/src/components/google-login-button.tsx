'use client';

import { getGoogleLoginUrl } from '@/lib/api';

type GoogleLoginButtonProps = {
  className?: string;
  label?: string;
};

export function GoogleLoginButton({
  className,
  label = 'Continue with Google',
}: GoogleLoginButtonProps) {
  return (
    <a
      href={getGoogleLoginUrl()}
      className={
        className ??
        'inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90'
      }
    >
      {label}
    </a>
  );
}

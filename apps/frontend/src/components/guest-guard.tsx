'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/locale-provider';

type GuestGuardProps = {
  children: React.ReactNode;
};

/** Keeps landing/login pages guest-only; signed-in users go to the library. */
export function GuestGuard({ children }: GuestGuardProps) {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/library');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--gradient-top),transparent_55%),radial-gradient(ellipse_at_bottom_right,var(--gradient-bottom),transparent_50%)]"
        />
        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-muted">{t('auth.checkingSession')}</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--gradient-top),transparent_55%),radial-gradient(ellipse_at_bottom_right,var(--gradient-bottom),transparent_50%)]"
        />
        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-muted">{t('auth.redirectingLibrary')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

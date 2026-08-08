'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
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
          <p className="text-sm text-muted">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--gradient-top),transparent_55%),radial-gradient(ellipse_at_bottom_right,var(--gradient-bottom),transparent_50%)]"
        />
        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-muted">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

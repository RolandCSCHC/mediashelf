import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';

type AppShellProps = {
  children: ReactNode;
  /** Optional footer / secondary strip below the main content. */
  footer?: ReactNode;
  /** Constrain main content width. */
  width?: 'narrow' | 'default' | 'wide';
  /** Vertically center main content (landing / login). */
  center?: boolean;
};

const widthClass = {
  narrow: 'max-w-md',
  default: 'max-w-3xl',
  wide: 'max-w-7xl',
} as const;

export function AppShell({
  children,
  footer,
  width = 'default',
  center = false,
}: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 ms-animate-fade-in bg-[radial-gradient(ellipse_at_top,var(--gradient-top),transparent_55%),radial-gradient(ellipse_at_bottom_right,var(--gradient-bottom),transparent_50%)]"
      />

      <div className="ms-animate-fade-in relative z-20">
        <SiteHeader />
      </div>

      <main
        className={[
          'relative z-10 mx-auto w-full flex-1 px-6 py-12 sm:py-16',
          widthClass[width],
          center ? 'flex flex-col justify-center' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>

      {footer ? (
        <footer className="relative z-10 border-t border-border/50">
          <div
            className={`mx-auto w-full px-6 py-4 ${widthClass[width === 'narrow' ? 'default' : width]}`}
          >
            {footer}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

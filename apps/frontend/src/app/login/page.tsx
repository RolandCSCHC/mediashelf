import { GoogleLoginButton } from '@/components/google-login-button';
import { SiteHeader } from '@/components/site-header';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(61,154,139,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(42,53,66,0.9),_transparent_50%)]"
      />

      <SiteHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-3 text-muted">
          MediaShelf uses Google accounts only. Your library stays private to
          your account.
        </p>

        <div className="mt-8">
          <GoogleLoginButton />
        </div>
      </main>
    </div>
  );
}

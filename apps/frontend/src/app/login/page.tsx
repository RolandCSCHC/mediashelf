import { AppShell } from '@/components/app-shell';
import { GoogleLoginButton } from '@/components/google-login-button';
import { GuestGuard } from '@/components/guest-guard';

export default function LoginPage() {
  return (
    <GuestGuard>
      <AppShell width="narrow" center>
        <p className="ms-animate-fade-up mb-3 text-sm uppercase tracking-[0.2em] text-muted">
          Account
        </p>
        <h1 className="ms-animate-fade-up ms-animate-delay-1 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Sign in
        </h1>
        <p className="ms-animate-fade-up ms-animate-delay-2 mt-3 text-muted">
          MediaShelf uses Google accounts only. Your library stays private to
          your account.
        </p>

        <div className="ms-animate-fade-up ms-animate-delay-3 mt-8">
          <GoogleLoginButton className="w-full sm:w-auto" />
        </div>
      </AppShell>
    </GuestGuard>
  );
}

import { AppShell } from '@/components/app-shell';
import { GuestGuard } from '@/components/guest-guard';
import { LoginHero } from '@/components/login-hero';

export default function LoginPage() {
  return (
    <GuestGuard>
      <AppShell width="narrow" center>
        <LoginHero />
      </AppShell>
    </GuestGuard>
  );
}

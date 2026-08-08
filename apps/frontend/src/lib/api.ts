import type { AuthUser, LogoutResponse } from '@mediashelf/shared-types';

const browserApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function getGoogleLoginUrl(): string {
  return `${browserApiUrl}/auth/google`;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${browserApiUrl}/auth/me`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load session (${response.status})`);
    }

    return (await response.json()) as AuthUser;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const response = await fetch(`${browserApiUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Logout failed (${response.status})`);
  }

  await response.json() as LogoutResponse;
}

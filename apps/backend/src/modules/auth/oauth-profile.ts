export type OAuthProvider = 'google' | 'microsoft';

export type OAuthProfile = {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name: string | null;
  picture: string | null;
};

export type MicrosoftOAuthProfile = {
  id: string;
  displayName?: string;
  userPrincipalName?: string;
  emails?: Array<{ value?: string }>;
  photos?: Array<{ value?: string }>;
  _json?: {
    mail?: string | null;
    userPrincipalName?: string | null;
  };
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function providerDisplayName(provider: OAuthProvider): string {
  return provider === 'google' ? 'Google' : 'Microsoft';
}

export function emailFromMicrosoftProfile(
  profile: MicrosoftOAuthProfile,
): string {
  const fromEmails = profile.emails?.find((entry) => entry.value)?.value;
  if (fromEmails) {
    return fromEmails;
  }

  if (profile._json?.mail) {
    return profile._json.mail;
  }

  if (profile.userPrincipalName) {
    return profile.userPrincipalName;
  }

  return profile._json?.userPrincipalName ?? '';
}

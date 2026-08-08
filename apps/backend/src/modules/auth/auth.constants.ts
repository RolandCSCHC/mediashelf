export const AUTH_COOKIE_NAME = 'mediashelf_token';

export const JWT_EXPIRES_IN = '7d';

/** Cookie max-age aligned with JWT expiry (7 days). */
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

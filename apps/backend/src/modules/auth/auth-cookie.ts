import type { CookieOptions } from 'express';
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
} from './auth.constants';

export function getAuthCookieOptions(): CookieOptions {
  // Prefer HTTPS detection over NODE_ENV so local Docker (production build on HTTP)
  // still works, while Render (HTTPS) gets Secure + SameSite=None for cross-origin.
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const isHttps = frontendUrl.startsWith('https://');

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

export function getClearAuthCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = getAuthCookieOptions();
  return options;
}

export { AUTH_COOKIE_NAME };

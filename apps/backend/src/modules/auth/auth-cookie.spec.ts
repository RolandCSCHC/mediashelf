import { AUTH_COOKIE_MAX_AGE_MS, AUTH_COOKIE_NAME } from './auth.constants';
import { getAuthCookieOptions, getClearAuthCookieOptions } from './auth-cookie';

describe('auth-cookie', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  describe('getAuthCookieOptions', () => {
    it('uses lax insecure cookies for http frontend (default localhost)', () => {
      delete process.env.FRONTEND_URL;

      expect(getAuthCookieOptions()).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: AUTH_COOKIE_MAX_AGE_MS,
        path: '/',
      });
    });

    it('uses secure SameSite=Lax cookies for https frontend (same-origin proxy)', () => {
      process.env.FRONTEND_URL = 'https://mediashelf.example';

      expect(getAuthCookieOptions()).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: AUTH_COOKIE_MAX_AGE_MS,
        path: '/',
      });
    });
  });

  describe('getClearAuthCookieOptions', () => {
    it('matches auth options without maxAge', () => {
      process.env.FRONTEND_URL = 'https://mediashelf.example';

      expect(getClearAuthCookieOptions()).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
    });
  });

  it('exports the expected cookie name', () => {
    expect(AUTH_COOKIE_NAME).toBe('mediashelf_token');
  });
});

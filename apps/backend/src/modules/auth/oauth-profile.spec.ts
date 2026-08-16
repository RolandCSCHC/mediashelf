import { emailFromMicrosoftProfile, normalizeEmail } from './oauth-profile';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com');
  });
});

describe('emailFromMicrosoftProfile', () => {
  it('prefers the emails array', () => {
    expect(
      emailFromMicrosoftProfile({
        id: 'ms_1',
        emails: [{ value: 'ada@outlook.com' }],
        userPrincipalName: 'ada@live.com',
        _json: { mail: 'other@outlook.com' },
      }),
    ).toBe('ada@outlook.com');
  });

  it('falls back to Graph mail, then UPN', () => {
    expect(
      emailFromMicrosoftProfile({
        id: 'ms_1',
        _json: { mail: 'ada@outlook.com' },
      }),
    ).toBe('ada@outlook.com');

    expect(
      emailFromMicrosoftProfile({
        id: 'ms_1',
        userPrincipalName: 'ada@live.com',
      }),
    ).toBe('ada@live.com');
  });
});

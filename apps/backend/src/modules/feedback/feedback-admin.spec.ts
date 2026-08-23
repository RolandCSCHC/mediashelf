import { isFeedbackAdminEmail } from './feedback-admin';

describe('isFeedbackAdminEmail', () => {
  it('matches the configured inbox email case-insensitively', () => {
    expect(isFeedbackAdminEmail('Ada@Example.com', 'ada@example.com')).toBe(
      true,
    );
  });

  it('rejects a different email', () => {
    expect(isFeedbackAdminEmail('other@example.com', 'ada@example.com')).toBe(
      false,
    );
  });

  it('rejects everyone when the inbox email is not configured', () => {
    expect(isFeedbackAdminEmail('ada@example.com', '')).toBe(false);
    expect(isFeedbackAdminEmail('ada@example.com', undefined)).toBe(false);
  });
});

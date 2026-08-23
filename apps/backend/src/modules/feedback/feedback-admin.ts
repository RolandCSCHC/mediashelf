export function isFeedbackAdminEmail(
  email: string | undefined,
  adminEmail = process.env.FEEDBACK_ADMIN_EMAIL,
): boolean {
  const configured = adminEmail?.trim().toLowerCase();
  const candidate = email?.trim().toLowerCase();

  if (!configured || !candidate) {
    return false;
  }

  return configured === candidate;
}

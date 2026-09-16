/** Shared password policy: 8+ chars, upper, lower, digit. */
export const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, and a number';

export function isPasswordPolicyValid(password: string) {
  return PASSWORD_POLICY.test(password);
}

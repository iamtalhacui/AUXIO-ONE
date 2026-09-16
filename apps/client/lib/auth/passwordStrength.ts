export type PasswordRuleKey = "minLength" | "upper" | "lower" | "number";

export type PasswordStrength = {
  rules: Record<PasswordRuleKey, boolean>;
  score: number;
  isValid: boolean;
  label: string;
  barClass: string;
};

const RULE_LABELS: Record<PasswordRuleKey, string> = {
  minLength: "At least 8 characters",
  upper: "One uppercase letter",
  lower: "One lowercase letter",
  number: "One number",
};

export function evaluatePassword(password: string): PasswordStrength {
  const rules = {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const score = Object.values(rules).filter(Boolean).length;
  const isValid = score === 4;

  let label = "Too weak";
  let barClass = "bg-slate-200";
  if (password.length === 0) {
    label = "Enter a password";
    barClass = "bg-slate-200";
  } else if (score <= 1) {
    label = "Weak";
    barClass = "bg-red-500";
  } else if (score === 2) {
    label = "Fair";
    barClass = "bg-orange-500";
  } else if (score === 3) {
    label = "Good";
    barClass = "bg-amber-400";
  } else {
    label = "Strong";
    barClass = "bg-emerald-500";
  }

  return { rules, score, isValid, label, barClass };
}

export function passwordRuleLabels() {
  return RULE_LABELS;
}

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, and a number";

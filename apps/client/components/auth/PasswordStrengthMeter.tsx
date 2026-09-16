"use client";

import {
  evaluatePassword,
  passwordRuleLabels,
  type PasswordRuleKey,
} from "@/lib/auth/passwordStrength";

const ORDER: PasswordRuleKey[] = ["minLength", "upper", "lower", "number"];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = evaluatePassword(password);
  const labels = passwordRuleLabels();
  const width = password.length === 0 ? 0 : (strength.score / 4) * 100;

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-muted">Password strength</span>
          <span
            className={`text-xs font-semibold transition-colors ${
              strength.score <= 1 && password.length > 0
                ? "text-red-600"
                : strength.score === 2
                  ? "text-orange-600"
                  : strength.score === 3
                    ? "text-amber-600"
                    : strength.score === 4
                      ? "text-emerald-600"
                      : "text-muted"
            }`}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${strength.barClass}`}
            style={{ width: `${width}%` }}
          />
        </div>
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-2">
        {ORDER.map((key) => {
          const ok = strength.rules[key];
          return (
            <li
              key={key}
              className={`flex items-center gap-2 text-xs transition-colors ${
                ok ? "text-emerald-700" : "text-muted"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                }`}
              >
                {ok ? "✓" : "·"}
              </span>
              {labels[key]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

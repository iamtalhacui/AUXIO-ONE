"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { evaluatePassword } from "@/lib/auth/passwordStrength";

export function AcceptInviteForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandLogo size={40} className="h-10 w-10 object-contain" />
            <span className="text-lg font-semibold">AUXIO One</span>
          </Link>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Invitation
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Set your password</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Choose a password to activate your AUXIO One account.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <PasswordStrengthMeter password={password} />

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Confirm password</span>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <button
            type="submit"
            disabled={!evaluatePassword(password).isValid}
            className="flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-70"
          >
            Activate account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Already activated?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-light">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

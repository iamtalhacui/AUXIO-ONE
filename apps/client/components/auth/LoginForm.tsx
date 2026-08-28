"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLoginMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { setCredentials } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/store/hooks";
import { loginCopy } from "@/lib/content/auth";
import { getDashboardHomeForRole } from "@/lib/dashboard/roles";

function getRedirectPath(role?: string, mustChangePassword?: boolean) {
  if (mustChangePassword) return "/change-password";
  return getDashboardHomeForRole(role);
}

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
      router.replace(getRedirectPath(result.user.role, result.mustChangePassword));
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              A1
            </span>
            <span className="text-lg font-semibold">AUXIO One</span>
          </Link>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {loginCopy.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to your account</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Use your Super Admin or organisation account credentials.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="superadmin@auxio.local"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Need an organisation account?{" "}
          <Link href="/get-started" className="font-medium text-primary hover:text-primary-light">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}

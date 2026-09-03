"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginCopy } from "@/lib/content/auth";
import { useOrgLoginMutation } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { setOrgCredentials } from "@/lib/store/orgAuthSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error, reset }] = useOrgLoginMutation();

  useEffect(() => {
    if (accessToken) router.replace("/org-admin");
  }, [accessToken, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setOrgCredentials(result));
      router.replace("/org-admin");
    } catch {
      // RTK error
    }
  }

  const errorMessage = error ? getErrorMessage(error, "Invalid email or password") : null;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="text-lg font-semibold">
            AUXIO One
          </Link>
        </div>

        <p className="text-xs font-medium uppercase tracking-wide text-muted">{loginCopy.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-2 text-sm text-muted">Use your organisation account credentials.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="input-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="input-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="input-field"
            />
          </label>
          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
          <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-70">
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

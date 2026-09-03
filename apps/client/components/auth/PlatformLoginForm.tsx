"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatformLoginMutation } from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { setPlatformCredentials } from "@/lib/store/platformAuthSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

export function PlatformLoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.platformAuth.accessToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error, reset }] = usePlatformLoginMutation();

  useEffect(() => {
    if (accessToken) router.replace("/super-admin");
  }, [accessToken, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setPlatformCredentials(result));
      router.replace("/super-admin");
    } catch {
      // RTK error
    }
  }

  const errorMessage = error ? getErrorMessage(error, "Invalid email or password") : null;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Platform</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Super Admin sign in</h1>
      <p className="mt-2 text-sm text-muted">Use your platform credentials.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="input-label">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
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
  );
}

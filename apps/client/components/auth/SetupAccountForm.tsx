"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSetupAccountMutation } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

export function SetupAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");
  const [setup, { isLoading, error }] = useSetupAccountMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    if (password !== confirm) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await setup({ token, password }).unwrap();
      router.replace("/login");
    } catch {
      // RTK error
    }
  }

  const errorMessage =
    localError || (error ? getErrorMessage(error, "Could not activate account") : null);

  if (!token) {
    return <p className="text-sm text-muted">This setup link is missing a token.</p>;
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="input-label">New password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          className="input-field"
        />
      </label>
      <label className="block">
        <span className="input-label">Confirm password</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
          className="input-field"
        />
      </label>
      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-70">
        {isLoading ? "Activating…" : "Activate account"}
      </button>
    </form>
  );
}

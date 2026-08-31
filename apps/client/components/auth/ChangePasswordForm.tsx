"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChangePasswordMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { getDashboardHomeForRole } from "@/lib/dashboard/roles";
import { getPostAuthPath } from "@/lib/dashboard/user-lifecycle";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { completePasswordChange } from "@/lib/features/auth/authSlice";

export function ChangePasswordForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const result = await changePassword({ currentPassword, newPassword }).unwrap();
      dispatch(
        completePasswordChange({
          mustChangePassword: result.mustChangePassword,
          user: result.user,
        }),
      );
      setSuccess("Password updated. Redirecting...");
      setTimeout(() => {
        router.replace(
          getPostAuthPath(
            result.user.role,
            result.user.status,
            result.mustChangePassword,
            getDashboardHomeForRole(result.user.role),
          ),
        );
      }, 800);
    } catch (err) {
      setError(getErrorMessage(err, "Could not change password"));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Security
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Change your password</h1>
        <p className="mt-2 text-sm text-muted">
          Your account must set a new password before continuing.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-70"
          >
            {isLoading ? "Saving..." : "Update password"}
          </button>
        </form>

        <Link href="/login" className="mt-6 block text-center text-sm text-muted hover:text-primary">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

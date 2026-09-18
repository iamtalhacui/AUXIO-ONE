"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useChangePasswordMutation } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";

// Org Admin security page — updates the signed-in user's password only.
export function OrgAdminPasswordForm() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [changePassword, { isLoading, error, reset }] = useChangePasswordMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");
    reset();

    if (newPassword.length < 8) {
      setLocalError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("New passwords do not match.");
      return;
    }

    try {
      const result = await changePassword({ currentPassword, newPassword }).unwrap();
      toast({ variant: "success", title: result.message || "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not update password",
        description: getErrorMessage(err, "Could not update password"),
      });
    }
  }

  const errorMessage =
    localError || (error ? getErrorMessage(error, "Could not update password") : null);

  return (
    <>
      <PageHeader title="Security" description="Update your account password." />
      <form className="dashboard-card max-w-xl space-y-5 p-6" onSubmit={handleSubmit}>
        <label className="block">
          <span className="input-label">Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="input-field"
          />
        </label>

        <label className="block">
          <span className="input-label">New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="input-field"
          />
        </label>

        <label className="block">
          <span className="input-label">Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="input-field"
          />
        </label>

        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-70">
          {isLoading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}

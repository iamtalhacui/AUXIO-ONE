"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useChangePasswordMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

export function OrgAdminPasswordForm() {
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
      await changePassword({ currentPassword, newPassword }).unwrap();
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not change password"));
    }
  }

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

      <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-70">
        {isLoading ? "Updating..." : "Update password"}
      </button>
    </form>
    </>
  );
}

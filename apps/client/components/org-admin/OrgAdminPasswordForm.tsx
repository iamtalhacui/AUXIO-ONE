"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export function OrgAdminPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
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

        <button type="submit" className="btn-primary">
          Update password
        </button>
      </form>
    </>
  );
}

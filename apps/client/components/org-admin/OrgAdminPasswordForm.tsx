"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { useChangePasswordMutation } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import {
  evaluatePassword,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "@/lib/auth/passwordStrength";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  show,
  onToggleShow,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="input-label">{label}</span>
      <span className="sec-input-wrap">
        <Lock className="sec-input-icon" aria-hidden />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="input-field sec-input"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="sec-toggle"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

// Org Admin security page — updates the signed-in user's password only.
export function OrgAdminPasswordForm() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState("");
  const [changePassword, { isLoading, error, reset }] = useChangePasswordMutation();

  const strength = evaluatePassword(newPassword);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = strength.isValid && passwordsMatch && currentPassword.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");
    reset();

    if (!strength.isValid) {
      setLocalError(PASSWORD_REQUIREMENTS_MESSAGE);
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
    <div className="sec-shell">
      <PageHeader
        title="Security"
        description="Keep your Org Admin account secure with a strong password."
      />

      <form className="sec-panel" onSubmit={handleSubmit}>
        <div className="sec-hero">
          <span className="sec-hero-icon" aria-hidden>
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="sec-hero-title">Change password</h2>
            <p className="sec-hero-desc">
              You’ll use this password the next time you sign in.
            </p>
          </div>
        </div>

        <div className="sec-body">
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            show={showCurrent}
            onToggleShow={() => setShowCurrent((value) => !value)}
          />

          <div className="space-y-3">
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              show={showNew}
              onToggleShow={() => setShowNew((value) => !value)}
              placeholder="Create a strong password"
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>

          <div className="space-y-2">
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              show={showConfirm}
              onToggleShow={() => setShowConfirm((value) => !value)}
              placeholder="Re-enter new password"
            />
            {passwordsMatch ? (
              <p className="sec-hint sec-hint-ok">Passwords match</p>
            ) : null}
            {passwordsMismatch ? (
              <p className="sec-hint sec-hint-bad">Passwords do not match</p>
            ) : null}
          </div>

          {errorMessage ? <p className="sec-error">{errorMessage}</p> : null}
        </div>

        <footer className="sec-footer">
          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="btn-primary w-full disabled:opacity-70 sm:w-auto"
          >
            {isLoading ? "Updating…" : "Update password"}
          </button>
        </footer>
      </form>
    </div>
  );
}

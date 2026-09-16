"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { evaluatePassword } from "@/lib/auth/passwordStrength";

type Step = "email" | "otp" | "password";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");
  const [info, setInfo] = useState("");

  const [forgotPassword, forgotState] = useForgotPasswordMutation();
  const [resetPassword, resetState] = useResetPasswordMutation();

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
    setLocalError("");
    setInfo("");
    try {
      const result = await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      setInfo(result.message);
      setStep("otp");
      setOtp("");
    } catch (err) {
      setLocalError(getErrorMessage(err, "Could not send reset code"));
    }
  }

  function handleOtpContinue(event: FormEvent) {
    event.preventDefault();
    setLocalError("");
    if (otp.length !== 6) {
      setLocalError("Enter the 6-digit code from your email");
      return;
    }
    setStep("password");
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    setLocalError("");

    const strength = evaluatePassword(password);
    if (!strength.isValid) {
      setLocalError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      );
      return;
    }
    if (password !== confirm) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        password,
      }).unwrap();
      router.replace("/login");
    } catch (err) {
      setLocalError(getErrorMessage(err, "Could not reset password"));
    }
  }

  const busy = forgotState.isLoading || resetState.isLoading;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandLogo size={36} className="h-9 w-9 object-contain" />
            <span className="text-lg font-semibold">AUXIO One</span>
          </Link>
        </div>

        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Account recovery
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {step === "email"
            ? "Forgot password"
            : step === "otp"
              ? "Enter verification code"
              : "Choose a new password"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {step === "email"
            ? "We will email a 6-digit code to reset your password."
            : step === "otp"
              ? `Enter the code sent to ${email}`
              : "Create a strong password for your organisation account."}
        </p>

        <div className="mt-6 flex gap-2">
          {(["email", "otp", "password"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step === s || (step === "otp" && i === 0) || (step === "password" && i < 2)
                  ? "bg-primary"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {step === "email" ? (
          <form className="mt-8 space-y-4" onSubmit={handleSendCode}>
            <label className="block">
              <span className="input-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input-field"
              />
            </label>
            {localError ? <ErrorBox message={localError} /> : null}
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70">
              {forgotState.isLoading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : null}

        {step === "otp" ? (
          <form className="mt-8 space-y-5" onSubmit={handleOtpContinue}>
            {info ? (
              <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                {info}
              </p>
            ) : null}
            <OtpInput value={otp} onChange={setOtp} disabled={busy} />
            {localError ? <ErrorBox message={localError} /> : null}
            <button
              type="submit"
              disabled={otp.length !== 6 || busy}
              className="btn-primary w-full disabled:opacity-70"
            >
              Continue
            </button>
            <button
              type="button"
              disabled={busy}
              className="w-full text-sm font-semibold text-primary hover:underline disabled:opacity-70"
              onClick={async () => {
                setLocalError("");
                try {
                  const result = await forgotPassword({
                    email: email.trim().toLowerCase(),
                  }).unwrap();
                  setInfo(result.message);
                  setOtp("");
                } catch (err) {
                  setLocalError(getErrorMessage(err, "Could not resend code"));
                }
              }}
            >
              Resend code
            </button>
            <button
              type="button"
              className="w-full text-sm text-muted hover:text-foreground"
              onClick={() => {
                setStep("email");
                setOtp("");
                setLocalError("");
              }}
            >
              Use a different email
            </button>
          </form>
        ) : null}

        {step === "password" ? (
          <form className="mt-8 space-y-4" onSubmit={handleReset}>
            <label className="block">
              <span className="input-label">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="input-field"
              />
            </label>
            <PasswordStrengthMeter password={password} />
            <label className="block">
              <span className="input-label">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="input-field"
              />
            </label>
            {localError ? <ErrorBox message={localError} /> : null}
            <button
              type="submit"
              disabled={busy || !evaluatePassword(password).isValid}
              className="btn-primary w-full disabled:opacity-70"
            >
              {resetState.isLoading ? "Updating…" : "Reset password"}
            </button>
            <button
              type="button"
              className="w-full text-sm text-muted hover:text-foreground"
              onClick={() => {
                setStep("otp");
                setLocalError("");
              }}
            >
              Back to code
            </button>
          </form>
        ) : null}

        <p className="mt-8 text-center text-sm text-muted">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary-light">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}

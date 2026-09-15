import { Suspense } from "react";
import Link from "next/link";
import { SetupAccountForm } from "@/components/auth/SetupAccountForm";

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <Link href="/" className="text-sm font-semibold text-primary">
          AUXIO One
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Set your password</h1>
        <p className="mt-2 text-sm text-muted">
          Activate your AUXIO One account to continue.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading…</p>}>
          <SetupAccountForm />
        </Suspense>
      </div>
    </div>
  );
}

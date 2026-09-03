"use client";

import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { mockOrganisations } from "@/lib/mocks/data";

export function PendingApprovalView() {
  const org = mockOrganisations[0];
  const submittedAt = new Date("2026-04-10T00:00:00.000Z").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <OnboardingShell organisationName={org.tradingName ?? org.legalName}>
      <div className="mx-auto max-w-2xl">
        <div className="dashboard-card overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-surface to-accent/5 px-8 py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Under review
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pending approval</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              Your onboarding profile has been submitted. An organisation administrator or manager
              will review your details before you can access operational features.
            </p>
          </div>

          <div className="space-y-4 px-8 py-8">
            <div className="rounded-xl border border-border/70 bg-background/50 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Status</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                  Submitted
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="text-sm text-muted">Submitted on</span>
                <span className="text-sm font-medium">{submittedAt}</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/15 bg-primary/5 px-5 py-4">
              <h2 className="text-sm font-semibold text-primary">What happens next?</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Your organisation reviews your profile and uploaded documents.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  You may be contacted if additional information is required.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  Once approved, you will gain full access to your dashboard and assigned features.
                </li>
              </ul>
            </div>

            <p className="text-center text-xs text-muted">
              You will remain on this screen until your account is verified. Sign out and check back
              later, or wait for an email notification when approved.
            </p>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

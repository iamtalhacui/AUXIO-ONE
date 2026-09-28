"use client";

import { IconBell, IconLock } from "@/components/dashboard/icons";
import { site } from "@/lib/content";
import type { RoleOnboardingTemplate } from "@/lib/onboarding/templates";
import type { DashboardOnboardingState } from "@/lib/onboarding/wizard-state";

type OnboardingPendingReviewViewProps = {
  firstName: string;
  orgName: string;
  roleLabel: string;
  submittedAt: Date;
  state: DashboardOnboardingState;
  template: RoleOnboardingTemplate;
  onViewDetails: () => void;
};

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function displayValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.join(", ") || "—";
  const trimmed = String(value ?? "").trim();
  return trimmed || "—";
}

export function OnboardingPendingReviewView({
  firstName,
  orgName,
  roleLabel,
  submittedAt,
  state,
  template,
  onViewDetails,
}: OnboardingPendingReviewViewProps) {
  const fullName = [state.personal.firstName, state.personal.lastName]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

  const position =
    displayValue(state.work.jobTitle) !== "—"
      ? displayValue(state.work.jobTitle)
      : displayValue(state.work.serviceLines) !== "—"
        ? displayValue(state.work.serviceLines)
        : template.roleLabel;

  const startDate = displayValue(
    state.work.startDatePreference || state.work.preferredHours,
  );

  const docsCount = Object.values(state.documents).filter((doc) => doc?.storedName).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {orgName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Onboarding</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-surface text-muted"
            aria-label="Notifications"
            disabled
          >
            <IconBell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <span className="rounded-full border border-border/70 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground/80">
            {roleLabel}
          </span>
        </div>
      </header>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Onboarding submitted
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Thanks, {firstName}. Your details are with {orgName}.
        </h2>
        <p className="mt-2 text-sm text-muted">There’s nothing else you need to do right now.</p>
      </div>

      <section className="rounded-2xl border border-primary/15 bg-primary/5 p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
          <h3 className="text-lg font-semibold">Pending review</h3>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            Usually within 2 business days
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/75">
          An authorised {orgName} admin will review your profile and documents. We’ll email you if
          anything needs your attention.
        </p>
        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-surface/70">
            <div className="h-full w-3/4 rounded-full bg-brand-deep" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
            <span>Submitted {formatLongDate(submittedAt)}</span>
            <span className="font-medium text-foreground/70">Review in progress</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="dashboard-card p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Read-only
          </p>
          <h3 className="mt-1 text-base font-semibold">Submitted information</h3>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Name</dt>
              <dd className="mt-1 text-sm font-medium">{fullName || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Position
              </dt>
              <dd className="mt-1 text-sm font-medium">{position}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Start date
              </dt>
              <dd className="mt-1 text-sm font-medium">{startDate}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Documents
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                </svg>
                {docsCount} submitted
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onViewDetails}
            className="mt-5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            View submitted details
          </button>
        </article>

        <article className="dashboard-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconLock className="h-4 w-4" />
            </span>
            <h3 className="text-base font-semibold">Your information is secure</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Your submission is read-only while it’s being reviewed.
          </p>
          <a
            href={`mailto:${site.contactEmail}`}
            className="mt-5 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Contact support
          </a>
        </article>
      </div>
    </div>
  );
}

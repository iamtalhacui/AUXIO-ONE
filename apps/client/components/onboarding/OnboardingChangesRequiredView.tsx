"use client";

import { useState } from "react";
import { IconBell } from "@/components/dashboard/icons";

export type ChangesRequiredItem = {
  id: string;
  title: string;
  detail: string;
  status: "ok" | "needs_update";
  actionLabel?: string;
  stepIndex?: number;
};

type OnboardingChangesRequiredViewProps = {
  firstName: string;
  orgName: string;
  roleLabel: string;
  returnedAt: Date;
  reviewerName: string;
  reviewNote: string;
  items: ChangesRequiredItem[];
  onEditItem: (stepIndex: number) => void;
  onResubmit: () => void;
};

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function OnboardingChangesRequiredView({
  firstName,
  orgName,
  roleLabel,
  returnedAt,
  reviewerName,
  reviewNote,
  items,
  onEditItem,
  onResubmit,
}: OnboardingChangesRequiredViewProps) {
  const [confirmed, setConfirmed] = useState(false);

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
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600">
          Action needed
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          A small update is needed, {firstName}.
        </h2>
        <p className="mt-2 text-sm text-muted">
          Your admin left a note to help you complete your onboarding.
        </p>
      </div>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-red-800">Changes required</h3>
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                Returned {formatLongDate(returnedAt)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-red-900/80">{reviewNote}</p>
            <p className="mt-4 flex items-center gap-2 text-xs text-red-800/70">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 1116 0" />
              </svg>
              Note from {reviewerName}, Org Admin
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-card p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Update the highlighted item
        </p>
        <h3 className="mt-1 text-base font-semibold">Your submission</h3>
        <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
          {items.map((item) => {
            const needsUpdate = item.status === "needs_update";
            return (
              <li
                key={item.id}
                className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  needsUpdate ? "bg-red-50" : "bg-surface"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className={`mt-0.5 text-sm ${needsUpdate ? "text-red-600" : "text-muted"}`}>
                    {item.detail}
                  </p>
                </div>
                {needsUpdate ? (
                  <button
                    type="button"
                    onClick={() => onEditItem(item.stepIndex ?? 0)}
                    className="shrink-0 rounded-lg border border-red-300 bg-surface px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    {item.actionLabel ?? "Edit"}
                  </button>
                ) : (
                  <span className="shrink-0 text-sm font-semibold text-emerald-700">Looks good</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-xl cursor-pointer items-start gap-3 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary"
          />
          <span>I’ve made the requested update and confirm this information is accurate.</span>
        </label>
        <button
          type="button"
          disabled={!confirmed}
          onClick={onResubmit}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Edit and resubmit →
        </button>
      </div>
    </div>
  );
}

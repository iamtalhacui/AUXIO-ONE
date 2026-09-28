"use client";

import Link from "next/link";
import { useAppSelector } from "@/lib/store/hooks";
import { IconBell, IconLock } from "@/components/dashboard/icons";

type LockedOnboardingHomeProps = {
  roleLabel: string;
  onboardingHref: string;
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTodayLabel(date: Date) {
  return date
    .toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

export function LockedOnboardingHome({
  roleLabel,
  onboardingHref,
}: LockedOnboardingHomeProps) {
  const user = useAppSelector((state) => state.orgAuth.user);
  const organisation = useAppSelector((state) => state.orgAuth.organisation);

  const firstName = user?.firstName ?? "there";
  const orgName = organisation?.name ?? "your organisation";
  const now = new Date();
  const greeting = greetingForHour(now.getHours());

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {orgName}
            <span className="mx-2 text-border">/</span>
            Overview
          </p>
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {formatTodayLabel(now)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Your {orgName} workspace is almost ready.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl bg-brand-panel px-6 py-7 text-brand-panel-foreground shadow-sm sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100/80">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <IconLock className="h-3.5 w-3.5" />
              </span>
              Workspace access
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              Complete your onboarding to unlock your workspace.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-teal-50/85 sm:text-[15px]">
              You&apos;re nearly there. We&apos;ll ask for a few personal details and documents so{" "}
              {orgName} can support you safely from day one.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href={onboardingHref}
              className="inline-flex items-center justify-center rounded-md bg-accent-light px-5 py-3 text-sm font-semibold text-brand-deep transition hover:opacity-90"
            >
              Continue onboarding →
            </Link>
            <span className="text-xs text-teal-100/70">About 10 minutes</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="dashboard-card flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Your next step
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                Tell us a little about you
              </h3>
            </div>
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
              Not started
            </span>
          </div>

          <div className="mt-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
              <div className="h-full w-0 rounded-full bg-primary" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Personal information</span>
              <span>1 of 5 steps</span>
            </div>
          </div>

          <Link
            href={onboardingHref}
            className="mt-5 text-sm font-semibold text-primary hover:underline"
          >
            Start step 1 →
          </Link>
        </article>

        <article className="dashboard-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden>
              ✦
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              A calm start
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            You can pause and return whenever it suits you. Nothing is submitted until
            you&apos;re ready.
          </p>
        </article>
      </div>

      <p className="pb-2 text-center text-sm text-muted">
        Need help?{" "}
        <a href="mailto:hello@auxio.one" className="font-medium text-primary hover:underline">
          Contact {orgName} support
        </a>
      </p>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type OnboardingShellProps = {
  children: ReactNode;
  organisationName?: string | null;
};

export function OnboardingShell({ children, organisationName }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-[#eef1f0]">
      <header className="border-b border-border/60 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              A
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                People & Compliance
              </p>
              <p className="text-sm font-semibold text-foreground">
                {organisationName ?? "Your organisation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                AC
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Alex Chen</p>
                <p className="text-xs text-muted">alex.chen@example.com</p>
              </div>
            </div>
            <Link
              href="/login"
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-primary/30 hover:text-foreground"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}

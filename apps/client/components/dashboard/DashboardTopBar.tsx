"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardConfig } from "@/lib/dashboard/config";
import { useAppSelector } from "@/lib/store/hooks";
import { IconBell, IconSettings } from "@/components/dashboard/icons";

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

type DashboardTopBarProps = {
  config: DashboardConfig;
  action?: ReactNode;
};

export function DashboardTopBar({ config, action }: DashboardTopBarProps) {
  const authUser = useAppSelector((state) => state.auth.user);
  const displayName = authUser?.name ?? config.roleLabel;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="dashboard-header">
      <div className="flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-9 w-9 items-center justify-center rounded-xl border border-border bg-background sm:flex">
            <span className="text-xs font-bold text-muted">A1</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{config.title}</p>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                {config.roleLabel}
              </span>
            </div>
            <p className="truncate text-xs text-muted">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {action ??
            (config.primaryAction ? (
              <Link
                href={config.primaryAction.href}
                className="inline-flex items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
              >
                {config.primaryAction.label}
              </Link>
            ) : null)}

          <label className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted md:flex lg:min-w-[260px]">
            <IconSearch />
            <input
              type="search"
              placeholder="Search..."
              className="w-full bg-transparent outline-none placeholder:text-muted"
            />
            <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold">⌘K</span>
          </label>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted transition hover:text-primary"
          >
            <IconBell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted transition hover:text-primary sm:flex"
          >
            <IconSettings className="h-[18px] w-[18px]" />
          </button>

          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-emerald-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useAppSelector } from "@/lib/store/hooks";

const QUICK_ACTIONS = [
  { label: "Register organisation", href: "/super-admin/organisations/new", primary: true },
  { label: "Demo requests", href: "/super-admin/demos", primary: false },
  { label: "Pending invites", href: "/super-admin/invites", primary: false },
  { label: "Audit log", href: "/super-admin/audit", primary: false },
] as const;

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type WelcomeBannerProps = {
  maintenanceMode: boolean;
};

export function WelcomeBanner({ maintenanceMode }: WelcomeBannerProps) {
  const user = useAppSelector((state) => state.platformAuth.user);
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="dashboard-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{greeting}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {user?.name ?? "Super Admin"}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Platform control room — review what needs action, then check portfolio health.
          </p>
        </div>
        {maintenanceMode ? (
          <Link
            href="/super-admin/settings"
            className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent"
          >
            Maintenance mode ON
          </Link>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={action.primary ? "btn-primary" : "btn-secondary"}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

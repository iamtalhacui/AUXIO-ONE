"use client";

import Link from "next/link";
import { useAppSelector } from "@/lib/store/hooks";
import type { OrgAdminOverview } from "@/lib/api/types";

const QUICK_ACTIONS = [
  { label: "Register team member", href: "/org-admin/team/register", primary: true },
  { label: "Review onboarding", href: "/org-admin/team", primary: false },
  { label: "Shift approvals", href: "/org-admin/shift-approvals", primary: false },
  { label: "Module settings", href: "/org-admin/settings/modules", primary: false },
] as const;

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type OrgAdminWelcomeBannerProps = {
  organisation: OrgAdminOverview["organisation"];
};

export function OrgAdminWelcomeBanner({ organisation }: OrgAdminWelcomeBannerProps) {
  const user = useAppSelector((state) => state.orgAuth.user);
  const greeting = greetingForHour(new Date().getHours());
  const name = user ? `${user.firstName} ${user.lastName}` : "Org Admin";

  return (
    <div className="dashboard-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{greeting}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            {organisation.name} · {organisation.plan} plan · {organisation.status}
          </p>
        </div>
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

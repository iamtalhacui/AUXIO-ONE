"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import type { OrgAdminOverview } from "@/lib/api/types";

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
  const name = user ? user.firstName : "there";

  return (
    <div className="oad-hero">
      <div className="min-w-0">
        <p className="oad-hero-greeting">
          {greeting}, <span className="text-foreground">{name}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="oad-org-chip">{organisation.name}</span>
          <span className="oad-meta-chip">{organisation.plan}</span>
          <span
            className={`oad-meta-chip ${
              organisation.status === "ACTIVE" ? "oad-meta-chip-ok" : "oad-meta-chip-warn"
            }`}
          >
            {organisation.status === "ACTIVE" ? "Active" : organisation.status}
          </span>
        </div>
      </div>
      <Link href="/org-admin/team/register" className="btn-primary gap-2 shrink-0">
        <UserPlus className="h-4 w-4" aria-hidden />
        Register member
      </Link>
    </div>
  );
}

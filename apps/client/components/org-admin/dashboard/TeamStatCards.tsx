"use client";

import Link from "next/link";
import type { OrgAdminOverview } from "@/lib/api/types";

type TeamStatCardsProps = {
  kpis: OrgAdminOverview["kpis"];
  teamJoinsLast14Days: OrgAdminOverview["teamJoinsLast14Days"];
};

// Tiny inline trend line — last 14 days of new joiners. Same technique as
// the Super Admin Organisations card: no axis/labels, purely decorative.
function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);

  if (points.every((p) => p === 0)) return null;

  return (
    <div className="flex h-8 items-end gap-0.5" aria-hidden="true">
      {points.map((value, index) => (
        <div
          key={index}
          className="w-1 rounded-full bg-primary/70"
          style={{ height: `${Math.max((value / max) * 100, value > 0 ? 15 : 4)}%` }}
        />
      ))}
    </div>
  );
}

// Vertical stack — sits beside TeamNeedsAttentionCard on the dashboard.
export function TeamStatCards({ kpis, teamJoinsLast14Days }: TeamStatCardsProps) {
  const sparkline = teamJoinsLast14Days.map((d) => d.count);

  return (
    <div className="flex flex-col gap-5">
      <article className="dashboard-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Team members</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{kpis.teamTotal}</p>
          </div>
          <Sparkline points={sparkline} />
        </div>
        <p className="mt-2 text-xs text-muted">{kpis.teamActive} active</p>
      </article>

      <article className="dashboard-card p-5">
        <p className="text-sm text-muted">Awaiting action</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{kpis.awaitingAction}</p>
        <p
          className={`mt-2 text-xs ${
            kpis.awaitingAction > 0 ? "font-semibold text-amber-700" : "font-semibold text-primary"
          }`}
        >
          Onboarding + approvals + invites
        </p>
      </article>

      <Link href="/org-admin/settings/modules" className="dashboard-card block p-5 transition hover:border-primary/40">
        <p className="text-sm text-muted">Modules enabled</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {kpis.modulesEnabled}/{kpis.modulesGranted}
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">Manage modules →</p>
      </Link>
    </div>
  );
}

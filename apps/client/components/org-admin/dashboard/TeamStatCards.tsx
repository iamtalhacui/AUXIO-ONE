"use client";

import Link from "next/link";
import type { OrgAdminOverview } from "@/lib/api/types";

type TeamStatCardsProps = {
  kpis: OrgAdminOverview["kpis"];
  teamJoinsLast14Days: OrgAdminOverview["teamJoinsLast14Days"];
};

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  if (points.every((p) => p === 0)) return null;

  return (
    <div className="flex h-7 items-end gap-0.5" aria-hidden>
      {points.map((value, index) => (
        <div
          key={index}
          className="w-1 rounded-full bg-primary/55"
          style={{ height: `${Math.max((value / max) * 100, value > 0 ? 14 : 3)}%` }}
        />
      ))}
    </div>
  );
}

export function TeamStatCards({ kpis, teamJoinsLast14Days }: TeamStatCardsProps) {
  const sparkline = teamJoinsLast14Days.map((d) => d.count);
  const awaitingTone = kpis.awaitingAction > 0 ? "oad-kpi-warn" : "";

  return (
    <div className="oad-kpi-grid">
      <Link href="/org-admin/team" className="oad-kpi">
        <div className="oad-kpi-top">
          <p className="oad-kpi-label">Team</p>
          <Sparkline points={sparkline} />
        </div>
        <p className="oad-kpi-value">{kpis.teamTotal}</p>
        <p className="oad-kpi-hint">{kpis.teamActive} active · last 14 days</p>
      </Link>

      <div className="oad-kpi">
        <p className="oad-kpi-label">Active</p>
        <p className="oad-kpi-value">{kpis.teamActive}</p>
        <p className="oad-kpi-hint">
          {kpis.teamTotal > 0
            ? `${Math.round((kpis.teamActive / kpis.teamTotal) * 100)}% of team`
            : "No members yet"}
        </p>
      </div>

      <Link href="/org-admin/team" className={`oad-kpi ${awaitingTone}`}>
        <p className="oad-kpi-label">Awaiting you</p>
        <p className="oad-kpi-value">{kpis.awaitingAction}</p>
        <p className="oad-kpi-hint">
          {kpis.awaitingAction > 0 ? "Reviews, approvals & invites" : "All clear"}
        </p>
      </Link>

      <Link href="/org-admin/settings/modules" className="oad-kpi">
        <p className="oad-kpi-label">Modules</p>
        <p className="oad-kpi-value">
          {kpis.modulesEnabled}
          <span className="oad-kpi-suffix">/{kpis.modulesGranted}</span>
        </p>
        <p className="oad-kpi-hint">Enabled of entitled</p>
      </Link>
    </div>
  );
}

"use client";

import type { PlatformOverview } from "@/lib/api/types";

type OverviewStatCardsProps = {
  kpis: PlatformOverview["kpis"];
  registrationsLast30Days: PlatformOverview["registrationsLast30Days"];
};

// Tiny inline trend line — last 14 days of registrations. No axis/labels,
// purely decorative context next to the Organisations count.
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

// Vertical stack — sits beside NeedsAttentionCard on the dashboard.
export function OverviewStatCards({ kpis, registrationsLast30Days }: OverviewStatCardsProps) {
  const last14Days = registrationsLast30Days.slice(-14).map((d) => d.count);

  const stats = [
    {
      label: "Organisations",
      value: String(kpis.organisationsTotal),
      change: `${kpis.organisationsActive} active`,
      tone: "neutral" as const,
      sparkline: last14Days,
    },
    {
      label: "Awaiting action",
      value: String(kpis.awaitingAction),
      change: "Approvals + pending demos",
      tone: kpis.awaitingAction > 0 ? ("warn" as const) : ("ok" as const),
      sparkline: null,
    },
    {
      label: "Suspended tenants",
      value: String(kpis.organisationsSuspended),
      change: kpis.organisationsSuspended > 0 ? "Needs review" : "None right now",
      tone: kpis.organisationsSuspended > 0 ? ("warn" as const) : ("ok" as const),
      sparkline: null,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {stats.map((stat) => (
        <article key={stat.label} className="dashboard-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
            </div>
            {stat.sparkline ? <Sparkline points={stat.sparkline} /> : null}
          </div>
          <p
            className={`mt-2 text-xs ${
              stat.tone === "warn"
                ? "font-semibold text-amber-700"
                : stat.tone === "ok"
                  ? "font-semibold text-primary"
                  : "text-muted"
            }`}
          >
            {stat.change}
          </p>
        </article>
      ))}
    </div>
  );
}

"use client";

import { mockOrganisations } from "@/lib/mocks/data";

function MiniBars({ bars }: { bars: number[] }) {
  const max = Math.max(...bars, 1);

  return (
    <div className="flex h-16 items-end gap-1">
      {bars.map((value, index) => (
        <div
          key={index}
          className="w-2 rounded-full bg-primary/80"
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function OverviewStatCards() {
  const organisations = mockOrganisations;

  const active = organisations.filter((org) => org.status === "ACTIVE").length;
  const pendingInvites = organisations.filter((org) => org.orgAdminEmail).length;

  const stats = [
    {
      label: "Total organisations",
      value: String(organisations.length),
      change: `${active} active`,
      changeLabel: "currently active",
      positive: true,
      bars: organisations.length ? [organisations.length] : [0],
    },
    {
      label: "Modules enabled",
      value: String(
        organisations.reduce((sum, org) => sum + org.modulesEnabled, 0),
      ),
      change: `${organisations.reduce((sum, org) => sum + org.modulesGranted, 0)} granted`,
      changeLabel: "across all tenants",
      positive: true,
      bars: organisations.map((org) => org.modulesEnabled),
    },
    {
      label: "Suspended tenants",
      value: String(organisations.filter((org) => org.status === "SUSPENDED").length),
      change: `${pendingInvites} with org admin`,
      changeLabel: "registered tenants",
      positive: false,
      bars: organisations.map((org) => (org.status === "SUSPENDED" ? 2 : 0)),
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {stats.map((stat) => (
        <article key={stat.label} className="dashboard-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-2 flex items-center gap-2 text-xs">
                <span
                  className={`font-semibold ${stat.positive ? "text-primary" : "text-accent"}`}
                >
                  {stat.change}
                </span>
                <span className="text-muted">{stat.changeLabel}</span>
              </p>
            </div>
            <MiniBars bars={stat.bars.length ? stat.bars : [0]} />
          </div>
        </article>
      ))}
    </div>
  );
}

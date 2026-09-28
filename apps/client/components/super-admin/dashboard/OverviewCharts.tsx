"use client";

import type { PlatformOverview } from "@/lib/api/types";

const PLAN_COLORS = {
  BASIC: "var(--chart-slate)",
  ADVANCED: "var(--chart-teal)",
  CUSTOM: "var(--chart-orange)",
} as const;

type OverviewChartsProps = {
  planMix: PlatformOverview["kpis"]["planMix"];
  organisationsTotal: number;
  organisationsActive: number;
  organisationsSuspended: number;
  demoPipeline: PlatformOverview["demoPipeline"];
};

function PlanMixDonut({
  planMix,
  total,
}: {
  planMix: OverviewChartsProps["planMix"];
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No organisations yet
      </div>
    );
  }

  const segments = [
    { key: "BASIC" as const, value: planMix.BASIC },
    { key: "ADVANCED" as const, value: planMix.ADVANCED },
    { key: "CUSTOM" as const, value: planMix.CUSTOM },
  ].filter((s) => s.value > 0);

  let cursor = 0;
  const stops = segments.map((s) => {
    const start = cursor;
    const pct = (s.value / total) * 100;
    cursor += pct;
    return `${PLAN_COLORS[s.key]} ${start}% ${cursor}%`;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={`Plan mix: Basic ${planMix.BASIC}, Advanced ${planMix.ADVANCED}, Custom ${planMix.CUSTOM}`}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-2xl font-semibold">{total}</span>
          <span className="text-xs text-muted">tenants</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {(["BASIC", "ADVANCED", "CUSTOM"] as const).map((plan) => (
          <li key={plan} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: PLAN_COLORS[plan] }}
            />
            <span className="text-muted">{plan}</span>
            <span className="font-semibold">{planMix[plan]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DemoFunnel({ pipeline }: { pipeline: OverviewChartsProps["demoPipeline"] }) {
  const steps = [
    { key: "PENDING" as const, label: "Pending", color: "bg-amber-400" },
    { key: "CONTACTED" as const, label: "Contacted", color: "bg-primary/70" },
    { key: "COMPLETED" as const, label: "Completed", color: "bg-primary" },
  ];
  const total = pipeline.PENDING + pipeline.CONTACTED + pipeline.COMPLETED;

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No demo requests yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-surface-subtle">
        {steps.map((step) => {
          const value = pipeline[step.key];
          if (value === 0) return null;
          return (
            <div
              key={step.key}
              className={`${step.color}`}
              style={{ width: `${(value / total) * 100}%` }}
              title={`${step.label}: ${value}`}
            />
          );
        })}
      </div>
      <ul className="space-y-2 text-sm">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${step.color}`} />
              {step.label}
            </span>
            <span className="font-semibold">{pipeline[step.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrganisationHealthBars({
  active,
  suspended,
  total,
}: {
  active: number;
  suspended: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No organisations yet
      </div>
    );
  }

  const rows = [
    { label: "Active", value: active, color: "bg-primary" },
    { label: "Suspended", value: suspended, color: "bg-accent" },
  ];

  return (
    <div className="flex h-36 flex-col justify-center gap-5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted">{row.label}</span>
            <span className="font-semibold">{row.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-subtle">
            <div
              className={`h-full rounded-full ${row.color}`}
              style={{ width: `${(row.value / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewCharts({
  planMix,
  organisationsTotal,
  organisationsActive,
  organisationsSuspended,
  demoPipeline,
}: OverviewChartsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Plan mix</h2>
        <p className="mb-4 text-sm text-muted">BASIC / ADVANCED / CUSTOM</p>
        <PlanMixDonut planMix={planMix} total={organisationsTotal} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Demo pipeline</h2>
        <p className="mb-4 text-sm text-muted">PENDING → CONTACTED → COMPLETED</p>
        <DemoFunnel pipeline={demoPipeline} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Organisation health</h2>
        <p className="mb-4 text-sm text-muted">Active vs suspended tenants</p>
        <OrganisationHealthBars
          active={organisationsActive}
          suspended={organisationsSuspended}
          total={organisationsTotal}
        />
      </article>
    </div>
  );
}

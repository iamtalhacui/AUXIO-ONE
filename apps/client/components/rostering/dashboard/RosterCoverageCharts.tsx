"use client";

import type { RosterOverview } from "@/lib/api/types";
import { formatShortDate } from "@/lib/rostering/format";

const FUNNEL_STEPS = [
  { key: "DRAFT" as const, label: "Draft", color: "bg-slate-300" },
  { key: "UNFILLED" as const, label: "Unfilled", color: "bg-amber-400" },
  { key: "OFFERED" as const, label: "Offered", color: "bg-sky-400" },
  { key: "ACCEPTED" as const, label: "Accepted", color: "bg-primary/70" },
  { key: "IN_PROGRESS_OR_DONE" as const, label: "In progress / done", color: "bg-primary" },
];

const TODAY_COLORS = {
  DRAFT: "#94a3b8",
  UNFILLED: "#f59e0b",
  OFFERED: "#0ea5e9",
  COVERED: "#0f766e",
} as const;

type RosterCoverageChartsProps = {
  coverageFunnelNext7Days: RosterOverview["coverageFunnelNext7Days"];
  todayStatusMix: RosterOverview["todayStatusMix"];
  weekLoad: RosterOverview["weekLoad"];
  scheduleEnabled: boolean;
};

function CoverageFunnel({
  funnel,
  enabled,
}: {
  funnel: RosterOverview["coverageFunnelNext7Days"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        Schedule module not enabled
      </div>
    );
  }

  const total = FUNNEL_STEPS.reduce((sum, step) => sum + funnel[step.key], 0);
  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No shifts in the next 7 days
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#f0eeeb]">
        {FUNNEL_STEPS.map((step) => {
          const value = funnel[step.key];
          if (value === 0) return null;
          return (
            <div
              key={step.key}
              className={step.color}
              style={{ width: `${(value / total) * 100}%` }}
              title={`${step.label}: ${value}`}
            />
          );
        })}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {FUNNEL_STEPS.map((step) => (
          <li key={step.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${step.color}`} />
              {step.label}
            </span>
            <span className="font-semibold">{funnel[step.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TodayStatusDonut({
  mix,
  enabled,
}: {
  mix: RosterOverview["todayStatusMix"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        Schedule module not enabled
      </div>
    );
  }

  const total = mix.DRAFT + mix.UNFILLED + mix.OFFERED + mix.COVERED;
  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No shifts today
      </div>
    );
  }

  const segments = (["DRAFT", "UNFILLED", "OFFERED", "COVERED"] as const)
    .map((key) => ({ key, value: mix[key] }))
    .filter((s) => s.value > 0);

  let cursor = 0;
  const stops = segments.map((s) => {
    const start = cursor;
    const pct = (s.value / total) * 100;
    cursor += pct;
    return `${TODAY_COLORS[s.key]} ${start}% ${cursor}%`;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={`Today: Draft ${mix.DRAFT}, Unfilled ${mix.UNFILLED}, Offered ${mix.OFFERED}, Covered ${mix.COVERED}`}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-semibold">{total}</span>
          <span className="text-xs text-muted">today</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {(["DRAFT", "UNFILLED", "OFFERED", "COVERED"] as const).map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TODAY_COLORS[key] }}
            />
            <span className="text-muted">
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </span>
            <span className="font-semibold">{mix[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeekLoadBars({
  weekLoad,
  enabled,
}: {
  weekLoad: RosterOverview["weekLoad"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        Schedule module not enabled
      </div>
    );
  }

  const max = Math.max(...weekLoad.map((d) => d.filled + d.open), 1);
  const any = weekLoad.some((d) => d.filled + d.open > 0);

  if (!any) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No shifts in the next 7 days
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weekLoad.map((day) => {
        const total = day.filled + day.open;
        return (
          <div key={day.date}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted">{formatShortDate(day.date)}</span>
              <span className="font-semibold">
                {day.filled} filled · {day.open} open
              </span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-[#f0eeeb]">
              {total === 0 ? null : (
                <>
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(day.filled / max) * 100}%` }}
                  />
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${(day.open / max) * 100}%` }}
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RosterCoverageCharts({
  coverageFunnelNext7Days,
  todayStatusMix,
  weekLoad,
  scheduleEnabled,
}: RosterCoverageChartsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Coverage funnel</h2>
        <p className="mb-4 text-sm text-muted">Next 7 days</p>
        <CoverageFunnel funnel={coverageFunnelNext7Days} enabled={scheduleEnabled} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Today&apos;s status</h2>
        <p className="mb-4 text-sm text-muted">Draft / Unfilled / Offered / Covered</p>
        <TodayStatusDonut mix={todayStatusMix} enabled={scheduleEnabled} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Week load</h2>
        <p className="mb-4 text-sm text-muted">Filled vs open by day</p>
        <WeekLoadBars weekLoad={weekLoad} enabled={scheduleEnabled} />
      </article>
    </div>
  );
}

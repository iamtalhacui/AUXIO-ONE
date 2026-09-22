"use client";

import Link from "next/link";
import type { EmployeeOverview } from "@/lib/api/types";
import { formatShortDate } from "@/lib/rostering/format";

const STATUS_COLORS = {
  OFFERED: "#0ea5e9",
  ACCEPTED: "#0f766e",
  IN_PROGRESS: "#f59e0b",
  DONE: "#94a3b8",
} as const;

type EmployeeWorkChartsProps = {
  weekLoad: EmployeeOverview["weekLoad"];
  myStatusMix: EmployeeOverview["myStatusMix"];
  availabilityNext7Days: EmployeeOverview["availabilityNext7Days"];
  scheduleEnabled: boolean;
};

function WeekLoadBars({
  weekLoad,
  enabled,
}: {
  weekLoad: EmployeeOverview["weekLoad"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        Schedule module not enabled
      </div>
    );
  }

  const max = Math.max(...weekLoad.map((d) => d.count), 1);
  const any = weekLoad.some((d) => d.count > 0);

  if (!any) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No shifts this week
      </div>
    );
  }

  return (
    <div className="flex h-36 flex-col justify-center gap-3">
      {weekLoad.map((day) => (
        <div key={day.date}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted">{formatShortDate(day.date)}</span>
            <span className="font-semibold">{day.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f0eeeb]">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(day.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusDonut({
  mix,
  enabled,
}: {
  mix: EmployeeOverview["myStatusMix"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        Schedule module not enabled
      </div>
    );
  }

  const total = mix.OFFERED + mix.ACCEPTED + mix.IN_PROGRESS + mix.DONE;
  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No active shifts yet
      </div>
    );
  }

  const segments = (["OFFERED", "ACCEPTED", "IN_PROGRESS", "DONE"] as const)
    .map((key) => ({ key, value: mix[key] }))
    .filter((s) => s.value > 0);

  let cursor = 0;
  const stops = segments.map((s) => {
    const start = cursor;
    const pct = (s.value / total) * 100;
    cursor += pct;
    return `${STATUS_COLORS[s.key]} ${start}% ${cursor}%`;
  });

  const labels = {
    OFFERED: "Offers",
    ACCEPTED: "Accepted",
    IN_PROGRESS: "In progress",
    DONE: "Done",
  } as const;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={`Status mix: Offers ${mix.OFFERED}, Accepted ${mix.ACCEPTED}, In progress ${mix.IN_PROGRESS}, Done ${mix.DONE}`}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-semibold">{total}</span>
          <span className="text-xs text-muted">mine</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {(["OFFERED", "ACCEPTED", "IN_PROGRESS", "DONE"] as const).map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[key] }}
            />
            <span className="text-muted">{labels[key]}</span>
            <span className="font-semibold">{mix[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AvailabilitySnapshot({
  days,
  enabled,
}: {
  days: EmployeeOverview["availabilityNext7Days"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        Schedule module not enabled
      </div>
    );
  }

  if (days.every((d) => d.level === null)) {
    return (
      <div className="flex h-36 flex-col items-center justify-center gap-2 text-center text-sm text-muted">
        <p>Availability not set yet</p>
        <Link
          href="/employee/availability"
          className="font-semibold text-primary hover:underline"
        >
          Set availability →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {days.map((day) => {
        const label =
          day.level === "FULL"
            ? "Available"
            : day.level === "UNAVAILABLE"
              ? "Unavailable"
              : "Not set";
        const tone =
          day.level === "FULL"
            ? "bg-primary/15 text-primary"
            : day.level === "UNAVAILABLE"
              ? "bg-rose-100 text-rose-800"
              : "bg-surface-muted text-muted";
        return (
          <div key={day.date} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{formatShortDate(day.date)}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function EmployeeWorkCharts({
  weekLoad,
  myStatusMix,
  availabilityNext7Days,
  scheduleEnabled,
}: EmployeeWorkChartsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">My week</h2>
        <p className="mb-4 text-sm text-muted">Assigned shifts next 7 days</p>
        <WeekLoadBars weekLoad={weekLoad} enabled={scheduleEnabled} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">My status mix</h2>
        <p className="mb-4 text-sm text-muted">Offers / Accepted / Active / Done</p>
        <StatusDonut mix={myStatusMix} enabled={scheduleEnabled} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Availability</h2>
        <p className="mb-4 text-sm text-muted">Next 7 days</p>
        <AvailabilitySnapshot days={availabilityNext7Days} enabled={scheduleEnabled} />
      </article>
    </div>
  );
}

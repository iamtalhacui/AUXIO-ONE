"use client";

import Link from "next/link";
import type { EmployeeOverview } from "@/lib/api/types";

type EmployeeStatCardsProps = {
  kpis: EmployeeOverview["kpis"];
  scheduleEnabled: boolean;
};

export function EmployeeStatCards({ kpis, scheduleEnabled }: EmployeeStatCardsProps) {
  return (
    <div className="flex flex-col gap-5">
      <article className="dashboard-card p-5">
        <p className="text-sm text-muted">Today</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {scheduleEnabled ? kpis.shiftsToday : "—"}
        </p>
        <p className="mt-2 text-xs text-muted">
          {scheduleEnabled
            ? kpis.inProgressToday > 0
              ? `${kpis.inProgressToday} in progress`
              : "No shift in progress"
            : "Schedule module off"}
        </p>
      </article>

      <article className="dashboard-card p-5">
        <p className="text-sm text-muted">Awaiting me</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {scheduleEnabled ? kpis.awaitingMe : "—"}
        </p>
        <p
          className={`mt-2 text-xs ${
            kpis.awaitingMe > 0
              ? "font-semibold text-amber-700"
              : "font-semibold text-primary"
          }`}
        >
          Offers + ready to start
        </p>
      </article>

      <Link
        href="/employee/shifts"
        className="dashboard-card block p-5 transition hover:border-primary/40"
      >
        <p className="text-sm text-muted">This week</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {scheduleEnabled ? kpis.weekShiftCount : "—"}
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">View my shifts →</p>
      </Link>
    </div>
  );
}

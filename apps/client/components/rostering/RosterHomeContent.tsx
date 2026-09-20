"use client";

import Link from "next/link";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import { useListScheduleShiftsQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import {
  formatLongDate,
  formatShiftTime,
  todayIso,
} from "@/lib/rostering/format";

/** Rostering Expert home — today's coverage snapshot. */
export function RosterHomeContent() {
  const today = todayIso();
  const { data: shifts = [], isLoading, error } = useListScheduleShiftsQuery(
    { from: today, to: today },
    { pollingInterval: LIVE_POLL_MS.lists },
  );

  const draft = shifts.filter((s) => s.status === "DRAFT").length;
  const unfilled = shifts.filter((s) => s.status === "UNFILLED").length;
  const offered = shifts.filter((s) => s.status === "OFFERED").length;
  const accepted = shifts.filter((s) => s.status === "ACCEPTED").length;
  const needsAttention = shifts.filter(
    (s) => s.status === "DRAFT" || s.status === "UNFILLED" || s.status === "OFFERED",
  );

  const stats = [
    { label: "Shifts today", value: shifts.length },
    { label: "Draft", value: draft },
    { label: "Unfilled", value: unfilled, tone: "warn" as const },
    { label: "Offers pending", value: offered },
    { label: "Accepted", value: accepted },
  ];

  if (isLoading) {
    return <p className="text-sm text-muted">Loading roster…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load today’s roster.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Rostering console
          </p>
          <h1 className="page-title mt-1">Today&apos;s roster</h1>
          <p className="page-subtitle">{formatLongDate(today)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/roster/matching" className="btn-secondary !rounded-lg">
            Matching
          </Link>
          <Link href="/roster/schedule" className="btn-primary">
            Open schedule
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="dashboard-card px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {stat.label}
            </p>
            <p
              className={`mt-2 text-3xl font-bold tracking-tight ${
                stat.tone === "warn" ? "text-amber-700" : "text-foreground"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="dashboard-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Needs matching</h2>
          <p className="mt-0.5 text-sm text-muted">
            Draft, unfilled, or offered shifts for today
          </p>
        </div>
        {needsAttention.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">
            Nothing open for today. Create drafts from Schedule when needed.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {needsAttention.map((shift) => (
              <li
                key={shift.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {shift.startTime} – {shift.endTime} · {shift.participantName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {shift.locationLabel} · {shift.serviceTitle}
                    {shift.offeredWorkerName
                      ? ` · Offered to ${shift.offeredWorkerName}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ShiftStatusPill status={shift.status} />
                  <Link
                    href={`/roster/matching?shift=${shift.id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Match
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

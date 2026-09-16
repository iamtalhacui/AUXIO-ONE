"use client";

import Link from "next/link";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import { DEMO_DATE, getWorker, workerName } from "@/lib/rostering/mock-data";
import { useRosterShifts } from "@/lib/rostering/store";

function formatDemoDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function RosterHomeContent() {
  const shifts = useRosterShifts();
  const today = shifts.filter((s) => s.date === DEMO_DATE);
  const unassigned = today.filter((s) => s.status === "UNASSIGNED").length;
  const offered = today.filter((s) => s.status === "OFFERED").length;
  const assigned = today.filter((s) => s.status === "ASSIGNED").length;
  const open = today.filter(
    (s) => s.status === "UNASSIGNED" || s.status === "OFFERED",
  );

  const stats = [
    { label: "Shifts today", value: today.length },
    { label: "Unassigned", value: unassigned, tone: "warn" as const },
    { label: "Offers pending", value: offered },
    { label: "Assigned", value: assigned },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Rostering console
          </p>
          <h1 className="page-title mt-1">Today&apos;s roster</h1>
          <p className="page-subtitle">{formatDemoDate(DEMO_DATE)}</p>
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            Unassigned or offered shifts for today
          </p>
        </div>
        {open.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">All of today&apos;s shifts are assigned.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {open.map((shift) => {
              const offeredTo = getWorker(shift.offeredWorkerId);
              return (
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
                      {offeredTo ? ` · Offered to ${workerName(offeredTo)}` : ""}
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
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

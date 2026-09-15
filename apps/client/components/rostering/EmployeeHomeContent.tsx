"use client";

import Link from "next/link";
import {
  DEMO_DATE,
  DEMO_EMPLOYEE_WORKER_ID,
  formatShiftTime,
} from "@/lib/rostering/mock-data";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  acceptShiftOffer,
  declineShiftOffer,
  useRosterShifts,
} from "@/lib/rostering/store";

function formatLongDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function EmployeeHomeContent() {
  const shifts = useRosterShifts();
  const offers = shifts.filter(
    (s) => s.offeredWorkerId === DEMO_EMPLOYEE_WORKER_ID && s.status === "OFFERED",
  );
  const mine = shifts.filter((s) => s.workerId === DEMO_EMPLOYEE_WORKER_ID);
  const today = mine.filter((s) => s.date === DEMO_DATE);
  const upcoming = mine
    .filter((s) => s.date >= DEMO_DATE && s.status !== "COMPLETED" && s.status !== "CANCELLED")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const next = upcoming[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          My dashboard
        </p>
        <h1 className="page-title mt-1">Your shifts</h1>
        <p className="page-subtitle">Published roster for Amina Hassan (demo)</p>
      </div>

      {offers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">Shift offers</h2>
          {offers.map((shift) => (
            <OfferCard key={shift.id} shiftId={shift.id} />
          ))}
        </section>
      ) : null}

      {next ? (
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Next shift
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{next.participantName}</h2>
          <p className="mt-1 text-sm text-muted">
            {formatLongDate(next.date)} · {formatShiftTime(next.startTime, next.endTime)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {next.locationLabel} · {next.serviceTitle}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ShiftStatusPill status={next.status} />
            <Link href={`/employee/shifts/${next.id}`} className="btn-primary">
              {next.date === DEMO_DATE ? "Open today’s shift" : "View shift"}
            </Link>
          </div>
        </section>
      ) : (
        <section className="dashboard-card p-6">
          <p className="text-sm text-muted">No upcoming assigned shifts.</p>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-card px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Today</p>
          <p className="mt-2 text-3xl font-bold">{today.length}</p>
        </div>
        <div className="dashboard-card px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Upcoming</p>
          <p className="mt-2 text-3xl font-bold">{upcoming.length}</p>
        </div>
        <Link
          href="/employee/availability"
          className="dashboard-card flex flex-col justify-center px-5 py-4 transition hover:border-primary/30"
        >
          <p className="text-sm font-semibold text-primary">Manage availability</p>
          <p className="mt-1 text-xs text-muted">Tell rostering when you can work</p>
        </Link>
      </div>

      <section className="dashboard-card">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Coming up</h2>
          <Link href="/employee/shifts" className="text-sm font-semibold text-primary hover:underline">
            All shifts
          </Link>
        </div>
        <ul className="divide-y divide-border/40">
          {upcoming.slice(0, 3).map((shift) => (
            <li key={shift.id}>
              <Link
                href={`/employee/shifts/${shift.id}`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#fafbfc]"
              >
                <div>
                  <p className="text-sm font-semibold">{shift.participantName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatLongDate(shift.date)} · {formatShiftTime(shift.startTime, shift.endTime)} ·{" "}
                    {shift.durationHours}h
                  </p>
                </div>
                <ShiftStatusPill status={shift.status} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function OfferCard({ shiftId }: { shiftId: string }) {
  const shifts = useRosterShifts();
  const shift = shifts.find((s) => s.id === shiftId);
  if (!shift) return null;

  return (
    <div className="dashboard-card border-sky-200 bg-sky-50/40 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-800">
            New shift offer
          </p>
          <h3 className="mt-1 text-lg font-semibold">{shift.participantName}</h3>
          <p className="mt-1 text-sm text-muted">
            {formatLongDate(shift.date)} · {formatShiftTime(shift.startTime, shift.endTime)} ·{" "}
            {shift.durationHours}h
          </p>
          <p className="mt-1 text-sm text-muted">
            {shift.locationLabel} · {shift.serviceTitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary !rounded-lg"
            onClick={() => declineShiftOffer(shift.id, DEMO_EMPLOYEE_WORKER_ID)}
          >
            Decline
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => acceptShiftOffer(shift.id, DEMO_EMPLOYEE_WORKER_ID)}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

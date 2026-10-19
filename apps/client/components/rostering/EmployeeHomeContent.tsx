"use client";

import { useState } from "react";
import Link from "next/link";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  useAcceptShiftOfferMutation,
  useDeclineShiftOfferMutation,
  useListMyShiftsQuery,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import type { ScheduleShift } from "@/lib/api/types";
import {
  formatLongDate,
  formatShiftTime,
  todayIso,
} from "@/lib/rostering/format";
import { useAppSelector } from "@/lib/store/hooks";

/** Employee dashboard — offers, next shift, quick links. */
export function EmployeeHomeContent() {
  const user = useAppSelector((s) => s.orgAuth.user);
  const { data: shifts = [], isLoading, error, refetch } = useListMyShiftsQuery(undefined, {
    pollingInterval: LIVE_POLL_MS.lists,
  });
  const today = todayIso();

  const offers = shifts.filter((s) => s.status === "OFFERED");
  const mine = shifts.filter(
    (s) =>
      s.status === "ACCEPTED" ||
      s.status === "IN_PROGRESS" ||
      s.status === "PENDING_APPROVAL" ||
      s.status === "APPROVED",
  );
  const todayShifts = mine.filter((s) => s.date === today);
  const upcoming = mine
    .filter((s) => s.date >= today && s.status !== "APPROVED")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const next = upcoming[0] ?? null;

  if (isLoading) {
    return <p className="text-sm text-muted">Loading your shifts…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load your shifts.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          My dashboard
        </p>
        <h1 className="page-title mt-1">Your shifts</h1>
        <p className="page-subtitle">
          {user ? `${user.firstName} ${user.lastName}` : "Employee"}
        </p>
      </div>

      {offers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">Shift offers</h2>
          {offers.map((shift) => (
            <OfferCard key={shift.id} shift={shift} onDone={() => void refetch()} />
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
            <Link href={`/my-shifts/${next.id}`} className="btn-primary">
              {next.date === today ? "Open today’s shift" : "View shift"}
            </Link>
          </div>
        </section>
      ) : (
        <section className="dashboard-card p-6">
          <p className="text-sm text-muted">No upcoming accepted shifts.</p>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-card px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Today</p>
          <p className="mt-2 text-3xl font-bold">{todayShifts.length}</p>
        </div>
        <div className="dashboard-card px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Upcoming</p>
          <p className="mt-2 text-3xl font-bold">{upcoming.length}</p>
        </div>
        <Link
          href="/my-availability"
          className="dashboard-card flex flex-col justify-center px-5 py-4 transition hover:border-primary/30"
        >
          <p className="text-sm font-semibold text-primary">Manage availability</p>
          <p className="mt-1 text-xs text-muted">Used when matching you to shifts</p>
        </Link>
      </div>

      <section className="dashboard-card">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Coming up</h2>
          <Link href="/my-shifts" className="text-sm font-semibold text-primary hover:underline">
            All shifts
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">No upcoming shifts yet.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {upcoming.slice(0, 3).map((shift) => (
              <li key={shift.id}>
                <Link
                  href={`/my-shifts/${shift.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-subtle"
                >
                  <div>
                    <p className="text-sm font-semibold">{shift.participantName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatLongDate(shift.date)} ·{" "}
                      {formatShiftTime(shift.startTime, shift.endTime)}
                    </p>
                  </div>
                  <ShiftStatusPill status={shift.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OfferCard({ shift, onDone }: { shift: ScheduleShift; onDone: () => void }) {
  const [accept, acceptState] = useAcceptShiftOfferMutation();
  const [decline, declineState] = useDeclineShiftOfferMutation();
  const [error, setError] = useState("");

  async function run(action: "accept" | "decline") {
    setError("");
    try {
      if (action === "accept") await accept(shift.id).unwrap();
      else await decline(shift.id).unwrap();
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update offer"));
    }
  }

  const busy = acceptState.isLoading || declineState.isLoading;

  return (
    <div className="dashboard-card border-sky-200 bg-sky-50/40 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-800">
            New shift offer
          </p>
          <h3 className="mt-1 text-lg font-semibold">{shift.participantName}</h3>
          <p className="mt-1 text-sm text-muted">
            {formatLongDate(shift.date)} · {formatShiftTime(shift.startTime, shift.endTime)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {shift.locationLabel} · {shift.serviceTitle}
          </p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary !rounded-lg"
            disabled={busy}
            onClick={() => void run("decline")}
          >
            Decline
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => void run("accept")}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

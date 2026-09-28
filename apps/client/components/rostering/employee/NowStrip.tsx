"use client";

import Link from "next/link";
import type { ScheduleShift } from "@/lib/api/types";
import { describeShiftClock } from "@/lib/rostering/useShiftClock";
import { ShiftClockBand, shiftClockCopy } from "./ShiftClockBand";
import { formatDayHeading, formatShiftTime } from "@/lib/rostering/format";

type Props = {
  /** Active shift takes priority, otherwise the soonest upcoming one. */
  shift: ScheduleShift | null;
  now: number | null;
  offersCount: number;
  onViewOffers: () => void;
};

/** The "what am I doing right now" answer, above the tabs. */
export function NowStrip({ shift, now, offersCount, onViewOffers }: Props) {
  if (!shift) {
    return (
      <section className="dashboard-card flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">No shifts coming up</p>
          <p className="mt-0.5 text-sm text-muted">
            {offersCount > 0
              ? "You have offers waiting for a response."
              : "Keep your availability current so the rostering team can match you."}
          </p>
        </div>
        {offersCount > 0 ? (
          <button type="button" className="btn-primary" onClick={onViewOffers}>
            Review {offersCount} offer{offersCount === 1 ? "" : "s"}
          </button>
        ) : (
          <Link href="/employee/availability" className="btn-secondary">
            Update availability
          </Link>
        )}
      </section>
    );
  }

  const clock = describeShiftClock(shift, now);
  const copy = shiftClockCopy(shift, clock);
  const live = clock.phase === "active" || clock.phase === "overrun";

  return (
    <section className="dashboard-card overflow-hidden">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
        <ShiftClockBand copy={copy} ready={clock.ready} pulse={live} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {live ? "Current shift" : "Next shift"}
            </p>
            <p className="mt-1 truncate text-lg font-bold tracking-tight text-foreground">
              {shift.participantName}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted">
              {formatDayHeading(shift.date)} ·{" "}
              {formatShiftTime(shift.startTime, shift.endTime)} · {shift.locationLabel}
            </p>
          </div>

          <Link href={`/employee/shifts/${shift.id}`} className="btn-primary shrink-0">
            {live
              ? "Resume shift"
              : clock.canStartNow
                ? "Open to start"
                : "View shift"}
          </Link>
        </div>
      </div>

      {offersCount > 0 ? (
        <button
          type="button"
          onClick={onViewOffers}
          className="flex w-full items-center justify-between gap-3 border-t border-border/50 bg-sky-50/50 px-5 py-3 text-left transition hover:bg-sky-50"
        >
          <span className="text-sm font-semibold text-sky-800">
            {offersCount} new shift offer{offersCount === 1 ? "" : "s"} waiting for your response
          </span>
          <span className="text-sm font-semibold text-sky-700">Review →</span>
        </button>
      ) : null}
    </section>
  );
}

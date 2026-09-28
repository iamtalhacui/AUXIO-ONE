"use client";

import type { ScheduleShift } from "@/lib/api/types";
import type { ShiftClock } from "@/lib/rostering/useShiftClock";
import { formatClock, formatDateTime, formatElapsed, formatVariance } from "@/lib/rostering/format";

type Props = {
  shift: ScheduleShift;
  clock: ShiftClock;
};

/** Outcome view for PENDING_APPROVAL / APPROVED / REJECTED. */
export function ShiftSummaryPanel({ shift, clock }: Props) {
  const rejected = shift.status === "REJECTED";
  const approved = shift.status === "APPROVED";

  return (
    <section className="dashboard-card overflow-hidden">
      <div
        className={`px-5 py-4 ${
          rejected
            ? "bg-red-50"
            : approved
              ? "bg-emerald-50"
              : "bg-orange-50"
        }`}
      >
        <h2
          className={`text-base font-semibold ${
            rejected ? "text-red-700" : approved ? "text-emerald-800" : "text-orange-900"
          }`}
        >
          {rejected
            ? "Returned by your Org Admin"
            : approved
              ? "Shift approved"
              : "Submitted for approval"}
        </h2>
        <p
          className={`mt-1 text-sm ${
            rejected ? "text-red-700" : approved ? "text-emerald-800" : "text-orange-900"
          }`}
        >
          {rejected
            ? "Read the note below and speak to your Org Admin about what to do next."
            : approved
              ? shift.reviewedByName
                ? `Approved by ${shift.reviewedByName}.`
                : "Automatically approved — your times were within the margin."
              : "An Org Admin is reviewing your recorded times."}
        </p>
      </div>

      {shift.reviewNote ? (
        <div className="border-t border-border/50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Review note
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-foreground">
            {shift.reviewNote}
          </p>
          {shift.reviewedAt ? (
            <p className="mt-1 text-xs text-muted">{formatDateTime(shift.reviewedAt)}</p>
          ) : null}
        </div>
      ) : null}

      <dl className="grid gap-px border-t border-border/50 bg-border/40 sm:grid-cols-2">
        <Row label="Scheduled" value={`${shift.startTime} – ${shift.endTime}`} />
        <Row
          label="Actual"
          value={
            shift.actualStartedAt && shift.actualEndedAt
              ? `${formatClock(shift.actualStartedAt)} – ${formatClock(shift.actualEndedAt)}`
              : "—"
          }
        />
        <Row label="Time worked" value={formatElapsed(clock.elapsedMs)} />
        <Row
          label="Variance"
          value={
            shift.startVarianceMinutes === null && shift.endVarianceMinutes === null
              ? "—"
              : `Start ${formatVariance(shift.startVarianceMinutes ?? 0)} · End ${formatVariance(
                  shift.endVarianceMinutes ?? 0,
                )}`
          }
        />
      </dl>

      {shift.finishReason ? (
        <div className="border-t border-border/50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Your reason
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {shift.finishReason}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

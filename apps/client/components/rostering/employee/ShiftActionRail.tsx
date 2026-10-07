"use client";

import type { ScheduleShift } from "@/lib/api/types";
import {
  EARLY_END_ALLOW_MINUTES,
  EARLY_START_ALLOW_MINUTES,
  LATE_END_ALLOW_MINUTES,
  LATE_START_APPROVAL_MINUTES,
  needsFinishApproval,
  type ShiftClock,
} from "@/lib/rostering/useShiftClock";
import { ShiftClockBand, shiftClockCopy } from "./ShiftClockBand";
import {
  formatCountdown,
  formatVariance,
} from "@/lib/rostering/format";

type Props = {
  shift: ScheduleShift;
  clock: ShiftClock;
  requiredRemaining: number;
  busy: boolean;
  starting: boolean;
  responding: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onStart: () => void;
  onOpenFinish: () => void;
  onReportIncident?: () => void;
};

/** The single place the primary action lives, sticky beside the workspace. */
export function ShiftActionRail({
  shift,
  clock,
  requiredRemaining,
  busy,
  starting,
  responding,
  onAccept,
  onDecline,
  onStart,
  onOpenFinish,
  onReportIncident,
}: Props) {
  const copy = shiftClockCopy(shift, clock);
  const live = clock.phase === "active" || clock.phase === "overrun";
  const canStart = clock.canStartNow;
  const blockedTooEarly = clock.startBlockedTooEarly;

  return (
    <div className="space-y-4">
      <ShiftClockBand copy={copy} ready={clock.ready} pulse={live} />

      {clock.phase === "offer" ? (
        <section className="dashboard-card space-y-3 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {shift.isBroadcast ? "Open shift available" : "Respond to this offer"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {shift.isBroadcast
                ? "This shift was broadcast to the team. Accept quickly — first eligible employee gets it."
                : "Accepting adds it to your roster. Declining sends it back to the rostering team."}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary w-full disabled:opacity-50"
            disabled={responding}
            onClick={onAccept}
          >
            {responding ? "Working…" : "Accept shift"}
          </button>
          {!shift.isBroadcast ? (
            <button
              type="button"
              className="btn-secondary w-full disabled:opacity-50"
              disabled={responding}
              onClick={onDecline}
            >
              Decline
            </button>
          ) : null}
        </section>
      ) : null}

      {clock.phase === "scheduled" || clock.phase === "soon" ? (
        <section className="dashboard-card space-y-3 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Start your shift</h2>
            <p className="mt-0.5 text-sm text-muted">
              You can start from {EARLY_START_ALLOW_MINUTES} minutes before the scheduled
              start ({shift.startTime}). Tasks and notes unlock once you start.
            </p>
          </div>

          {blockedTooEarly ? (
            <p className="rounded-lg border border-border/60 bg-surface-subtle px-3.5 py-2.5 text-xs font-medium text-foreground">
              Too early to start. Come back within {EARLY_START_ALLOW_MINUTES} minutes of{" "}
              {shift.startTime}
              {clock.ready && clock.msToStart > 0
                ? ` · opens in ${formatCountdown(clock.msToStart - EARLY_START_ALLOW_MINUTES * 60 * 1000)}`
                : null}
              .
            </p>
          ) : null}

          {clock.startingTooEarly ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900">
              Scheduled start is in {formatCountdown(clock.msToStart)}. You can start now
              (within the {EARLY_START_ALLOW_MINUTES}-minute early window). Starting more
              than {LATE_START_APPROVAL_MINUTES} minutes late will need Org Admin approval
              when you finish.
            </p>
          ) : null}

          <button
            type="button"
            className="btn-primary w-full disabled:opacity-50"
            disabled={busy || !canStart}
            onClick={onStart}
          >
            {starting
              ? "Starting…"
              : blockedTooEarly
                ? `Available from ${EARLY_START_ALLOW_MINUTES} min early`
                : "Start shift"}
          </button>
        </section>
      ) : null}

      {live ? (
        <section className="dashboard-card space-y-3 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Finish up</h2>
            <p className="mt-0.5 text-sm text-muted">
              {requiredRemaining > 0
                ? `${requiredRemaining} required task${
                    requiredRemaining === 1 ? "" : "s"
                  } still to tick off.`
                : "You're ready to submit this shift."}
            </p>
          </div>

          <VarianceMeter clock={clock} />

          <button
            type="button"
            className="btn-primary w-full disabled:opacity-50"
            disabled={busy || requiredRemaining > 0}
            onClick={onOpenFinish}
          >
            Finish shift
          </button>

          {onReportIncident ? (
            <button
              type="button"
              className="btn-secondary w-full disabled:opacity-50"
              disabled={busy}
              onClick={onReportIncident}
            >
              Report incident
            </button>
          ) : null}
        </section>
      ) : null}

      {clock.phase === "submitted" ? (
        <section className="dashboard-card px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Awaiting approval</h2>
          <p className="mt-1 text-sm text-muted">
            Your start or end time was outside the allowed windows (start within{" "}
            {EARLY_START_ALLOW_MINUTES} min early / {LATE_START_APPROVAL_MINUTES} min late;
            end within {EARLY_END_ALLOW_MINUTES / 60} h early / {LATE_END_ALLOW_MINUTES} min
            late), so an Org Admin is reviewing this shift.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function VarianceMeter({ clock }: { clock: ShiftClock }) {
  const endVariance = clock.endVarianceMinutes ?? 0;
  const startVariance = clock.startVarianceMinutes ?? 0;
  const outside =
    clock.outsideMargin ||
    needsFinishApproval(startVariance, endVariance);
  const worst = Math.max(
    Math.abs(startVariance),
    Math.abs(endVariance),
    LATE_START_APPROVAL_MINUTES,
  );
  const fill = Math.min(100, (worst / (EARLY_END_ALLOW_MINUTES / 2)) * 100);

  return (
    <div className="rounded-lg border border-border/60 bg-surface-subtle px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Time variance
        </p>
        <p
          className={`text-xs font-semibold tabular-nums ${
            outside ? "text-orange-700" : "text-emerald-700"
          }`}
        >
          {outside ? "Needs a reason" : "Within window"}
        </p>
      </div>

      <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            outside ? "bg-orange-500" : "bg-emerald-500"
          }`}
          style={{ width: `${clock.ready ? fill : 0}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>Start {formatVariance(startVariance)}</span>
        <span>End {formatVariance(endVariance)}</span>
      </div>
    </div>
  );
}

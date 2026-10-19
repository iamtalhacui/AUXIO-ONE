"use client";

import type { ScheduleShift } from "@/lib/api/types";
import type { ShiftClock } from "@/lib/rostering/useShiftClock";
import { formatCountdown, formatElapsed, formatShiftTime } from "@/lib/rostering/format";

export type ClockTone = "neutral" | "primary" | "active" | "warn" | "danger" | "ok";

export type ClockCopy = {
  caption: string;
  value: string;
  hint: string;
  tone: ClockTone;
};

/** Turns a shift + tick into the one time statement that matters right now. */
export function shiftClockCopy(shift: ScheduleShift, clock: ShiftClock): ClockCopy {
  const window = formatShiftTime(shift.startTime, shift.endTime);

  switch (clock.phase) {
    case "offer":
      return {
        caption: clock.msToStart >= 0 ? "Starts in" : "Scheduled",
        value: clock.msToStart >= 0 ? formatCountdown(clock.msToStart) : window,
        hint: "Respond to hold this shift",
        tone: "primary",
      };

    case "scheduled":
      return {
        caption: "Starts in",
        value: formatCountdown(clock.msToStart),
        hint: window,
        tone: "neutral",
      };

    case "soon":
      if (clock.msToStart < 0) {
        return {
          caption: "Late to start",
          value: formatElapsed(-clock.msToStart),
          hint: `Was due to start at ${shift.startTime}`,
          tone: "warn",
        };
      }
      return {
        caption: "Starts in",
        value: formatElapsed(clock.msToStart),
        hint: "Ready when you are",
        tone: "primary",
      };

    case "active":
      return {
        caption: "Running for",
        value: formatElapsed(clock.elapsedMs),
        hint: `${formatCountdown(clock.msToEnd)} until ${shift.endTime}`,
        tone: "active",
      };

    case "overrun":
      return {
        caption: "Past scheduled end",
        value: formatElapsed(clock.overrunMs),
        hint: `Was due to end at ${shift.endTime}`,
        tone: "danger",
      };

    case "submitted":
      return {
        caption: "Submitted",
        value: formatElapsed(clock.elapsedMs),
        hint: "Waiting on your Manager",
        tone: "warn",
      };

    default:
      return {
        caption: shift.status === "REJECTED" ? "Returned" : "Worked",
        value: clock.elapsedMs > 0 ? formatElapsed(clock.elapsedMs) : window,
        hint: shift.status === "REJECTED" ? "Review the note below" : window,
        tone: shift.status === "REJECTED" ? "danger" : "ok",
      };
  }
}

const TONE_TEXT: Record<ClockTone, string> = {
  neutral: "text-foreground",
  primary: "text-primary",
  active: "text-emerald-700",
  warn: "text-amber-800",
  danger: "text-red-600",
  ok: "text-emerald-700",
};

const TONE_SURFACE: Record<ClockTone, string> = {
  neutral: "border-border/50 bg-surface-subtle",
  primary: "border-primary/25 bg-primary/5",
  active: "border-emerald-200 bg-emerald-50",
  warn: "border-amber-200 bg-amber-50",
  danger: "border-red-200 bg-red-50",
  ok: "border-emerald-200 bg-emerald-50",
};

const TONE_DOT: Record<ClockTone, string> = {
  neutral: "bg-slate-400",
  primary: "bg-primary",
  active: "bg-emerald-500",
  warn: "bg-amber-400",
  danger: "bg-red-500",
  ok: "bg-emerald-500",
};

type Props = {
  copy: ClockCopy;
  ready: boolean;
  pulse?: boolean;
  size?: "sm" | "lg";
};

export function ShiftClockBand({ copy, ready, pulse = false, size = "lg" }: Props) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${TONE_SURFACE[copy.tone]} ${
        size === "lg" ? "sm:px-5 sm:py-4" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          {pulse && ready ? (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${TONE_DOT[copy.tone]}`}
            />
          ) : null}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${TONE_DOT[copy.tone]}`} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {copy.caption}
        </p>
      </div>
      <p
        className={`mt-1 font-bold tabular-nums tracking-tight ${TONE_TEXT[copy.tone]} ${
          size === "lg" ? "text-3xl" : "text-xl"
        }`}
      >
        {ready ? copy.value : "—"}
      </p>
      <p className="mt-0.5 text-xs text-muted">{copy.hint}</p>
    </div>
  );
}

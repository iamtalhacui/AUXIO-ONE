"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScheduleShift } from "@/lib/api/types";
import { useGetOrganisationQuery } from "@/lib/api/authApi";
import { todayIso } from "./format";

/** Start more than this many minutes late → approval on finish. */
export const LATE_START_APPROVAL_MINUTES = 15;
/** May start from this many minutes before scheduled start. */
export const EARLY_START_ALLOW_MINUTES = 30;
/**
 * Max minutes before scheduled end that still auto-approves.
 * Short shifts use min(this, half duration).
 */
export const EARLY_END_ALLOW_MINUTES = 30;
/** Finish more than this many minutes after scheduled end → approval. */
export const LATE_END_ALLOW_MINUTES = 15;

/** @deprecated Use LATE_START_APPROVAL_MINUTES / LATE_END_ALLOW_MINUTES. */
export const VARIANCE_MARGIN_MINUTES = LATE_START_APPROVAL_MINUTES;

/** Early-end allow for one shift: min(30, half duration), at least 1 minute. */
export function earlyEndAllowMinutes(durationMinutes: number): number {
  const half = Math.floor(Math.max(0, durationMinutes) / 2);
  return Math.max(1, Math.min(EARLY_END_ALLOW_MINUTES, half));
}

/** Inside this window the shift is treated as "about to start". */
export const STARTING_SOON_MS = 60 * 60 * 1000;

/** Soft UI warning when starting early but still inside the allow window. */
export const EARLY_START_WARNING_MS = EARLY_START_ALLOW_MINUTES * 60 * 1000;

export type ShiftPhase =
  | "offer"
  | "scheduled"
  | "soon"
  | "active"
  | "overrun"
  | "submitted"
  | "closed";

export type ShiftClock = {
  /** False until the first client tick, so SSR never renders a live number. */
  ready: boolean;
  /** Organisation IANA timezone used for scheduled wall-clock maths. */
  timeZone: string;
  phase: ShiftPhase;
  scheduledStart: Date;
  scheduledEnd: Date;
  /** Milliseconds until scheduled start (negative once it has passed). */
  msToStart: number;
  /** Time since the shift was actually started. */
  elapsedMs: number;
  /** Milliseconds until scheduled end (negative once overrun). */
  msToEnd: number;
  overrunMs: number;
  startVarianceMinutes: number | null;
  endVarianceMinutes: number | null;
  /** Allowed early-end minutes for this shift (min 30, half duration). */
  earlyEndAllowMinutes: number;
  /** True when finishing now would require a reason and Manager approval. */
  outsideMargin: boolean;
  isActive: boolean;
  /** Local calendar date matches the shift's roster date (informational). */
  isShiftDay: boolean;
  /** True when now is within the early-start allow window (or later). */
  canStartNow: boolean;
  /** Soft warning: early, but still within the 30-minute allow window. */
  startingTooEarly: boolean;
  /** Hard block: more than 30 minutes before scheduled start. */
  startBlockedTooEarly: boolean;
};

/** Shared ticker so a list of shifts shares one interval. */
export function useNowTick(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

/**
 * Interpret YYYY-MM-DD + HH:mm as wall clock in `timeZone`.
 * Mirrors the server `zonedWallTimeToUtc` helper.
 */
export function zonedWallTimeToUtc(dateKey: string, hhmm: string, timeZone: string): Date {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utcGuess));
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? NaN);
    const asSeen = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    if (!Number.isFinite(asSeen)) return new Date(utcGuess);
    return new Date(utcGuess - (asSeen - utcGuess));
  } catch {
    return new Date(utcGuess);
  }
}

export function needsFinishApproval(
  startVarianceMinutes: number,
  endVarianceMinutes: number,
  durationMinutes: number,
): boolean {
  const earlyEndAllow = earlyEndAllowMinutes(durationMinutes);
  return (
    startVarianceMinutes > LATE_START_APPROVAL_MINUTES ||
    startVarianceMinutes < -EARLY_START_ALLOW_MINUTES ||
    endVarianceMinutes < -earlyEndAllow ||
    endVarianceMinutes > LATE_END_ALLOW_MINUTES
  );
}

export function describeShiftClock(
  shift: ScheduleShift,
  now: number | null,
  timeZone = "UTC",
): ShiftClock {
  const scheduledStart = zonedWallTimeToUtc(shift.date, shift.startTime, timeZone);
  let scheduledEnd = zonedWallTimeToUtc(shift.date, shift.endTime, timeZone);
  // Overnight shifts store endTime on the next calendar day (e.g. 22:00 → 02:00).
  if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
    scheduledEnd = new Date(scheduledEnd.getTime() + 24 * 60 * 60 * 1000);
  }
  const t = now ?? scheduledStart.getTime();

  const msToStart = scheduledStart.getTime() - t;
  const msToEnd = scheduledEnd.getTime() - t;
  const startedAt = shift.actualStartedAt ? new Date(shift.actualStartedAt).getTime() : null;
  const endedAt = shift.actualEndedAt ? new Date(shift.actualEndedAt).getTime() : null;

  const startVarianceMinutes =
    shift.startVarianceMinutes ??
    (startedAt === null ? null : Math.round((startedAt - scheduledStart.getTime()) / 60000));

  const endReference = endedAt ?? (shift.status === "IN_PROGRESS" ? t : null);
  const endVarianceMinutes =
    shift.endVarianceMinutes ??
    (endReference === null
      ? null
      : Math.round((endReference - scheduledEnd.getTime()) / 60000));

  const earlyEndAllow = earlyEndAllowMinutes(shift.durationMinutes);
  const outsideMargin =
    startVarianceMinutes !== null &&
    endVarianceMinutes !== null &&
    needsFinishApproval(
      startVarianceMinutes,
      endVarianceMinutes,
      shift.durationMinutes,
    );

  const isShiftDay = todayIso() === shift.date;
  const startBlockedTooEarly =
    shift.status === "ACCEPTED" && msToStart > EARLY_START_ALLOW_MINUTES * 60 * 1000;
  const canStartNow = shift.status === "ACCEPTED" && !startBlockedTooEarly;
  const startingTooEarly =
    canStartNow && msToStart > 0 && msToStart <= EARLY_START_WARNING_MS;

  let phase: ShiftPhase;
  switch (shift.status) {
    case "OFFERED":
      phase = "offer";
      break;
    case "ACCEPTED":
      phase =
        canStartNow && msToStart <= STARTING_SOON_MS ? "soon" : "scheduled";
      break;
    case "IN_PROGRESS":
      phase = msToEnd < 0 ? "overrun" : "active";
      break;
    case "PENDING_APPROVAL":
      phase = "submitted";
      break;
    default:
      phase = "closed";
  }

  return {
    ready: now !== null,
    timeZone,
    phase,
    scheduledStart,
    scheduledEnd,
    msToStart,
    elapsedMs: startedAt === null ? 0 : Math.max(0, (endedAt ?? t) - startedAt),
    msToEnd,
    overrunMs: Math.max(0, -msToEnd),
    startVarianceMinutes,
    endVarianceMinutes,
    earlyEndAllowMinutes: earlyEndAllow,
    outsideMargin,
    isActive: shift.status === "IN_PROGRESS",
    isShiftDay,
    canStartNow,
    startingTooEarly,
    startBlockedTooEarly,
  };
}

export function useShiftClock(shift: ScheduleShift | undefined) {
  const { data: org } = useGetOrganisationQuery();
  const timeZone = org?.timezone || "UTC";

  const fast =
    shift?.status === "IN_PROGRESS" ||
    shift?.status === "ACCEPTED" ||
    shift?.status === "OFFERED";
  const now = useNowTick(fast ? 1000 : 60000);

  return useMemo(
    () => (shift ? describeShiftClock(shift, now, timeZone) : null),
    [shift, now, timeZone],
  );
}

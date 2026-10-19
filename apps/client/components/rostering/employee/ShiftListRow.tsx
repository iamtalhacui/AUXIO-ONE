"use client";

import Link from "next/link";
import type { ScheduleShift } from "@/lib/api/types";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import { describeShiftClock } from "@/lib/rostering/useShiftClock";
import { shiftClockCopy } from "./ShiftClockBand";
import { IconClock } from "@/components/dashboard/icons";
import {
  formatCountdown,
  formatDuration,
  formatShortDate,
} from "@/lib/rostering/format";

type Props = {
  shift: ScheduleShift;
  now: number | null;
  showDate?: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  busy?: boolean;
};

export function ShiftListRow({
  shift,
  now,
  showDate = false,
  onAccept,
  onDecline,
  busy = false,
}: Props) {
  const clock = describeShiftClock(shift, now);
  const copy = shiftClockCopy(shift, clock);
  const isOffer = shift.status === "OFFERED" && Boolean(onAccept);
  const totalTasks = shift.tasks?.length ?? 0;
  const doneTasks = shift.tasks?.filter((t) => t.completedAt).length ?? 0;

  const body = (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
      <div className="flex shrink-0 flex-row items-center gap-3 sm:w-28 sm:flex-col sm:items-start sm:gap-0.5">
        <p className="text-base font-bold tabular-nums tracking-tight text-foreground">
          {shift.startTime}
        </p>
        <p className="text-xs text-muted">
          {showDate ? `${formatShortDate(shift.date)} · ` : ""}
          {shift.endTime} · {formatDuration(shift.durationMinutes)}
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {shift.participantName}
        </p>
        <p className="mt-0.5 truncate text-sm text-muted">
          {shift.serviceTitle} · {shift.locationLabel}
        </p>
        {totalTasks > 0 ? (
          <p className="mt-1 text-xs text-muted">
            {shift.status === "IN_PROGRESS"
              ? `${doneTasks} of ${totalTasks} tasks done`
              : `${totalTasks} task${totalTasks === 1 ? "" : "s"}`}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {clock.ready && (clock.phase === "active" || clock.phase === "overrun") ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-emerald-800">
            <IconClock className="h-3.5 w-3.5" />
            {copy.value}
          </span>
        ) : clock.ready && clock.phase === "soon" && clock.msToStart > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
            <IconClock className="h-3.5 w-3.5" />
            in {formatCountdown(clock.msToStart)}
          </span>
        ) : null}
        <ShiftStatusPill status={shift.status} audience="employee" size="sm" />
      </div>
    </div>
  );

  if (!isOffer) {
    return (
      <li>
        <Link
          href={`/my-shifts/${shift.id}`}
          className="block transition hover:bg-surface-subtle"
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li className="bg-sky-50/40">
      {body}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-5">
        <button
          type="button"
          className="btn-primary !px-4 !py-2 disabled:opacity-50"
          disabled={busy}
          onClick={() => onAccept?.(shift.id)}
        >
          Accept
        </button>
        <button
          type="button"
          className="btn-secondary !px-4 !py-2 disabled:opacity-50"
          disabled={busy}
          onClick={() => onDecline?.(shift.id)}
        >
          Decline
        </button>
        <Link
          href={`/my-shifts/${shift.id}`}
          className="ml-auto text-sm font-semibold text-primary hover:underline"
        >
          View details
        </Link>
      </div>
    </li>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import { useListMyShiftsQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import type { ScheduleShift } from "@/lib/api/types";
import {
  formatDuration,
  formatLongDate,
  formatShiftTime,
  todayIso,
} from "@/lib/rostering/format";

/**
 * Employee timesheets — derived from finished shifts until a dedicated
 * timesheet API exists. Read-only summary of worked time.
 */
export function EmployeeTimesheetsContent() {
  const {
    data: shifts = [],
    isLoading,
    error,
  } = useListMyShiftsQuery(undefined, { pollingInterval: LIVE_POLL_MS.lists });

  const rows = useMemo(() => {
    return shifts
      .filter(
        (s) =>
          s.status === "APPROVED" ||
          s.status === "PENDING_APPROVAL" ||
          s.status === "REJECTED",
      )
      .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
  }, [shifts]);

  const stats = useMemo(() => {
    const approved = rows.filter((s) => s.status === "APPROVED");
    const pending = rows.filter((s) => s.status === "PENDING_APPROVAL");
    const thisMonth = todayIso().slice(0, 7);
    const monthMinutes = approved
      .filter((s) => s.date.startsWith(thisMonth))
      .reduce((sum, s) => sum + workedMinutes(s), 0);
    const totalMinutes = approved.reduce((sum, s) => sum + workedMinutes(s), 0);
    return {
      approvedCount: approved.length,
      pendingCount: pending.length,
      monthHours: formatDuration(monthMinutes),
      totalHours: formatDuration(totalMinutes),
    };
  }, [rows]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Timesheets" description="Loading worked time…" />
        <div className="dashboard-card h-28 animate-pulse" />
        <div className="dashboard-card h-64 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Timesheets" />
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getErrorMessage(error, "Could not load timesheets.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Timesheets"
        description="Hours from your finished shifts. Submissions follow the existing shift approval workflow."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="This month" value={stats.monthHours} />
        <Stat label="All approved" value={stats.totalHours} />
        <Stat label="Approved entries" value={String(stats.approvedCount)} />
        <Stat
          label="Awaiting approval"
          value={String(stats.pendingCount)}
          tone={stats.pendingCount > 0 ? "warn" : undefined}
        />
      </div>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Entries</h2>
          <p className="mt-0.5 text-sm text-muted">
            Built from shifts you have finished. Open a row to see the full shift record.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-semibold text-foreground">No timesheet entries yet</p>
            <p className="mt-1 text-sm text-muted">
              Finish a shift and it will appear here once submitted or approved.
            </p>
            <Link href="/my-shifts" className="btn-primary mt-5 inline-flex">
              Go to shifts
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {rows.map((shift) => {
              const mins = workedMinutes(shift);
              return (
                <li key={shift.id}>
                  <Link
                    href={`/my-shifts/${shift.id}`}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-surface-subtle sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {shift.participantName}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatLongDate(shift.date)} ·{" "}
                        {formatShiftTime(shift.startTime, shift.endTime)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {shift.serviceTitle} · {shift.locationLabel}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {formatDuration(mins)}
                      </span>
                      <ShiftStatusPill
                        status={shift.status}
                        audience="employee"
                        size="sm"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function workedMinutes(shift: ScheduleShift) {
  if (shift.actualStartedAt && shift.actualEndedAt) {
    const ms =
      new Date(shift.actualEndedAt).getTime() -
      new Date(shift.actualStartedAt).getTime();
    return Math.max(0, Math.round(ms / 60000));
  }
  return shift.durationMinutes;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn";
}) {
  return (
    <div className="dashboard-card px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-1 text-lg font-bold tracking-tight tabular-nums ${
          tone === "warn" ? "text-amber-800" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

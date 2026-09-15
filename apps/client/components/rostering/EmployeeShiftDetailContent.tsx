"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  DEMO_EMPLOYEE_WORKER_ID,
  formatShiftTime,
} from "@/lib/rostering/mock-data";
import { useRosterShifts } from "@/lib/rostering/store";

function formatLongDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function EmployeeShiftDetailContent({ shiftId }: { shiftId: string }) {
  const shifts = useRosterShifts();
  const shift = shifts.find(
    (s) =>
      s.id === shiftId &&
      (s.workerId === DEMO_EMPLOYEE_WORKER_ID ||
        s.offeredWorkerId === DEMO_EMPLOYEE_WORKER_ID),
  );

  if (!shift) {
    return (
      <div className="space-y-4">
        <Link
          href="/employee/shifts"
          className="inline-flex text-sm font-semibold text-primary hover:underline"
        >
          ← Back to shifts
        </Link>
        <p className="text-sm text-muted">Shift not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/employee/shifts"
        className="inline-flex text-sm font-semibold text-primary hover:underline"
      >
        ← Back to shifts
      </Link>

      <PageHeader
        title={shift.participantName}
        description={`${formatLongDate(shift.date)} · ${formatShiftTime(shift.startTime, shift.endTime)}`}
        action={<ShiftStatusPill status={shift.status} />}
      />

      <section className="dashboard-card divide-y divide-border/40">
        <DetailRow label="Time" value={formatShiftTime(shift.startTime, shift.endTime)} />
        <DetailRow label="Duration" value={`${shift.durationHours} hours`} />
        <DetailRow label="Location" value={shift.locationLabel} />
        <DetailRow label="Service" value={`${shift.serviceTitle} (${shift.serviceLine})`} />
        <DetailRow label="Participant" value={shift.participantName} />
        <DetailRow label="Notes" value={shift.notes || "No notes for this shift."} />
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-medium sm:text-right">{value}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import { useGetParticipantCareViewQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { formatLongDate, formatShiftTime } from "@/lib/rostering/format";

/**
 * Roster-derived participant care view (OX-012).
 * Only unlocked by published / accepted / completed roster relationships.
 * This is NOT the Manager Customers module.
 */
export function ParticipantCareViewContent({ customerId }: { customerId: string }) {
  const { data, isLoading, error } = useGetParticipantCareViewQuery(customerId);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading care summary…</p>;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/employee/shifts"
          className="inline-flex text-sm font-semibold text-primary hover:underline"
        >
          ← Back to shifts
        </Link>
        <p className="text-sm text-red-600">
          {getErrorMessage(
            error,
            "You do not have roster access to this participant.",
          )}
        </p>
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
        title={data.displayName}
        description="Care-relevant details for a participant you support via roster."
      />

      <section className="dashboard-card divide-y divide-border/40">
        <CareRow label="Service line" value={data.serviceLine || "—"} />
        <CareRow label="Support summary" value={data.supportSummary || "—"} />
        <CareRow
          label="Plan period"
          value={
            data.planStartDate || data.planEndDate
              ? `${data.planStartDate ?? "—"} → ${data.planEndDate ?? "—"}`
              : "—"
          }
        />
        <CareRow
          label="Phone"
          value={data.emergencyContactPhone || "—"}
        />
        <CareRow label="Goals" value={data.goals || "—"} />
        <CareRow label="Risks" value={data.risks || "—"} />
      </section>

      <section className="dashboard-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Your shift relationship</h2>
          <p className="mt-0.5 text-sm text-muted">
            Published / accepted / completed links that grant this view
          </p>
        </div>
        <ul className="divide-y divide-border/40">
          {data.shiftRelationships.map((rel) => (
            <li key={rel.shiftId}>
              <Link
                href={`/employee/shifts/${rel.shiftId}`}
                className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-subtle"
              >
                <div>
                  <p className="text-sm font-semibold">{rel.serviceTitle}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatLongDate(rel.date)} ·{" "}
                    {formatShiftTime(rel.startTime, rel.endTime)}
                  </p>
                </div>
                <ShiftStatusPill status={rel.status} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-medium">{value}</p>
    </div>
  );
}

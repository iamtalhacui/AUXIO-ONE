"use client";

import { useState } from "react";
import Link from "next/link";
import type { ScheduleShift } from "@/lib/api/types";
import { useGetParticipantCareViewQuery } from "@/lib/api/authApi";
import { IconChevronDown } from "@/components/dashboard/icons";
import { formatDuration, formatLongDate, formatShiftTime } from "@/lib/rostering/format";

type Props = {
  shift: ScheduleShift;
  /** During an active shift this collapses out of the way of the work surface. */
  collapsible?: boolean;
};

/** Everything an employee can read before the shift starts. */
export function ShiftPrepPanel({ shift, collapsible = false }: Props) {
  const [open, setOpen] = useState(!collapsible);
  const { data: care } = useGetParticipantCareViewQuery(shift.customerId ?? "", {
    skip: !shift.customerId,
  });

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    shift.locationLabel,
  )}`;

  return (
    <section className="dashboard-card overflow-hidden">
      <button
        type="button"
        onClick={() => (collapsible ? setOpen((v) => !v) : undefined)}
        className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left ${
          collapsible ? "transition hover:bg-surface-subtle" : "cursor-default"
        }`}
      >
        <div>
          <h2 className="text-base font-semibold text-foreground">Shift brief</h2>
          <p className="mt-0.5 text-sm text-muted">
            Location, service and participant details
          </p>
        </div>
        {collapsible ? (
          <IconChevronDown
            className={`h-5 w-5 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          />
        ) : null}
      </button>

      {open ? (
        <div className="border-t border-border/50">
          <dl className="grid gap-px bg-border/40 sm:grid-cols-2">
            <Field label="Date" value={formatLongDate(shift.date)} />
            <Field
              label="Scheduled time"
              value={`${formatShiftTime(shift.startTime, shift.endTime)} · ${formatDuration(
                shift.durationMinutes,
              )}`}
            />
            <Field
              label="Location"
              value={shift.locationLabel}
              action={
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Directions
                </a>
              }
            />
            <Field label="Service" value={`${shift.serviceTitle} · ${shift.serviceLine}`} />
          </dl>

          {shift.notes ? (
            <div className="border-t border-border/50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Planning notes from your roster team
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                {shift.notes}
              </p>
            </div>
          ) : null}

          {care ? (
            <div className="border-t border-border/50 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  About {care.displayName}
                </p>
                {shift.customerId ? (
                  <Link
                    href={`/my-participants/${shift.customerId}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Full care summary
                  </Link>
                ) : null}
              </div>

              <div className="mt-3 space-y-3">
                {care.supportSummary ? (
                  <CareBlock label="Support summary" value={care.supportSummary} />
                ) : null}
                {care.goals ? <CareBlock label="Goals" value={care.goals} /> : null}
                {care.risks ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Risks
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-amber-900">
                      {care.risks}
                    </p>
                  </div>
                ) : null}
                {care.emergencyContactPhone ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface-subtle px-3.5 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Emergency contact
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">
                        {care.emergencyContactName ?? "Contact"}
                      </p>
                    </div>
                    <a
                      href={`tel:${care.emergencyContactPhone}`}
                      className="btn-secondary !px-3.5 !py-2 text-xs"
                    >
                      {care.emergencyContactPhone}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Field({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
        {action}
      </div>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function CareBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  formatShiftTime,
  getEligibleEmployees,
  getWorker,
  workerName,
} from "@/lib/rostering/mock-data";
import { offerShift, useRosterShifts } from "@/lib/rostering/store";

function formatLongDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MatchingContent() {
  const shifts = useRosterShifts();
  const searchParams = useSearchParams();
  const initialShift = searchParams.get("shift");

  const openShifts = useMemo(
    () =>
      shifts
        .filter((s) => s.status === "UNASSIGNED" || s.status === "OFFERED")
        .sort((a, b) =>
          `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
        ),
    [shifts],
  );

  const [selectedId, setSelectedId] = useState<string | null>(initialShift);
  const [message, setMessage] = useState("");

  const selected =
    openShifts.find((s) => s.id === selectedId) ??
    openShifts.find((s) => s.id === initialShift) ??
    openShifts[0] ??
    null;

  const eligible = selected ? getEligibleEmployees(shifts, selected) : [];
  const offeredWorker = selected?.offeredWorkerId
    ? getWorker(selected.offeredWorkerId)
    : null;

  function handleOffer(workerId: string) {
    if (!selected) return;
    const result = offerShift(selected.id, workerId);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    const worker = getWorker(workerId);
    setMessage(
      worker
        ? `Offer sent to ${workerName(worker)}. Waiting for accept or decline.`
        : "Offer sent.",
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Matching"
        description="Offer unassigned shifts to eligible employees."
      />

      {message ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
          {message}
        </div>
      ) : null}

      {openShifts.length === 0 ? (
        <div className="dashboard-card px-5 py-12 text-center text-sm text-muted">
          No unassigned shifts. Create a shift from Schedule first.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="space-y-3 lg:col-span-2">
            <h2 className="text-sm font-semibold text-muted">
              Unassigned & offered ({openShifts.length})
            </h2>
            <ul className="space-y-3">
              {openShifts.map((shift) => {
                const active = selected?.id === shift.id;
                return (
                  <li key={shift.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(shift.id);
                        setMessage("");
                      }}
                      className={`w-full rounded-xl border px-4 py-3.5 text-left transition ${
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 bg-surface hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{shift.participantName}</p>
                          <p className="mt-0.5 text-xs text-muted">{shift.locationLabel}</p>
                        </div>
                        <ShiftStatusPill status={shift.status} />
                      </div>
                      <p className="mt-2 text-sm font-medium">
                        {formatLongDate(shift.date)} ·{" "}
                        {formatShiftTime(shift.startTime, shift.endTime)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {shift.durationHours}h · {shift.serviceLine} · {shift.serviceTitle}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="dashboard-card lg:col-span-3">
            {!selected ? (
              <p className="px-5 py-12 text-center text-sm text-muted">
                Select a shift to view eligible employees.
              </p>
            ) : (
              <>
                <div className="border-b border-border/50 px-5 py-4">
                  <h2 className="text-base font-semibold">
                    Eligible employees · {selected.participantName}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatLongDate(selected.date)} ·{" "}
                    {formatShiftTime(selected.startTime, selected.endTime)} ·{" "}
                    {selected.serviceTitle}
                  </p>
                  {selected.status === "OFFERED" && offeredWorker ? (
                    <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900">
                      Offer pending: {workerName(offeredWorker)}. Waiting for response.
                    </p>
                  ) : null}
                </div>

                <ul className="divide-y divide-border/40">
                  {eligible.map((row) => {
                    const worker = getWorker(row.workerId);
                    if (!worker) return null;
                    const isPendingOffer = selected.offeredWorkerId === worker.id;
                    const offerLocked = selected.status === "OFFERED";
                    const canOffer = row.eligible && !offerLocked;

                    return (
                      <li
                        key={row.workerId}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{workerName(worker)}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Chip
                              ok={row.available}
                              okLabel="Available"
                              badLabel="Unavailable"
                            />
                            <Chip
                              ok={row.complianceOk}
                              okLabel="Ready"
                              badLabel="Not ready"
                            />
                            <Chip
                              ok={!row.hasConflict}
                              okLabel="No conflict"
                              badLabel="Conflict"
                            />
                          </div>
                          {row.blockers.length > 0 ? (
                            <p className="mt-2 text-xs text-muted">
                              {row.blockers.join(" · ")}
                            </p>
                          ) : null}
                        </div>

                        <div className="shrink-0">
                          {isPendingOffer ? (
                            <span className="status-pill bg-sky-50 text-sky-700">
                              Offer pending
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!canOffer}
                              onClick={() => handleOffer(worker.id)}
                              className={`btn-primary !px-3 !py-2 ${
                                !canOffer ? "cursor-not-allowed opacity-40" : ""
                              }`}
                            >
                              Offer Shift
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Chip({
  ok,
  okLabel,
  badLabel,
}: {
  ok: boolean;
  okLabel: string;
  badLabel: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {ok ? okLabel : badLabel}
    </span>
  );
}

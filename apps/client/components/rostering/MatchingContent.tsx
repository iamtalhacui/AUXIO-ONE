"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  useListMatchCandidatesQuery,
  useListScheduleShiftsQuery,
  usePublishOfferShiftMutation,
  usePublishUnfilledShiftMutation,
  useWithdrawShiftOfferMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { ScheduleShift } from "@/lib/api/types";
import {
  formatDuration,
  formatLongDate,
  formatShiftTime,
  todayIso,
} from "@/lib/rostering/format";

/**
 * Matching board: pick a draft/unfilled/offered shift, review hard-rule
 * candidates, then publish+offer (or publish empty / withdraw offer).
 */
export function MatchingContent() {
  const searchParams = useSearchParams();
  const initialShift = searchParams.get("shift");

  // Load a wide window so open shifts across the week appear.
  const from = todayIso();
  const to = (() => {
    const d = new Date(`${from}T12:00:00`);
    d.setDate(d.getDate() + 28);
    return d.toISOString().slice(0, 10);
  })();

  const { data: allShifts = [], isLoading, error, refetch } = useListScheduleShiftsQuery({
    from: (() => {
      const d = new Date(`${from}T12:00:00`);
      d.setDate(d.getDate() - 7);
      return d.toISOString().slice(0, 10);
    })(),
    to,
  });

  const openShifts = useMemo(
    () =>
      allShifts
        .filter((s) =>
          s.status === "DRAFT" || s.status === "UNFILLED" || s.status === "OFFERED",
        )
        .sort((a, b) =>
          `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
        ),
    [allShifts],
  );

  const [selectedId, setSelectedId] = useState<string | null>(initialShift);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const selected =
    openShifts.find((s) => s.id === selectedId) ??
    openShifts.find((s) => s.id === initialShift) ??
    openShifts[0] ??
    null;

  const {
    data: candidates = [],
    isFetching: loadingCandidates,
  } = useListMatchCandidatesQuery(selected?.id ?? "", {
    skip: !selected,
  });

  const [publishOffer, offerState] = usePublishOfferShiftMutation();
  const [publishEmpty, emptyState] = usePublishUnfilledShiftMutation();
  const [withdraw, withdrawState] = useWithdrawShiftOfferMutation();

  const busy = offerState.isLoading || emptyState.isLoading || withdrawState.isLoading;

  async function handleOffer(workerId: string) {
    if (!selected) return;
    setActionError("");
    setMessage("");
    try {
      await publishOffer({ id: selected.id, workerId }).unwrap();
      setMessage("Offer published. Waiting for the employee to accept or decline.");
      void refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not publish offer"));
    }
  }

  async function handlePublishEmpty() {
    if (!selected) return;
    setActionError("");
    try {
      await publishEmpty(selected.id).unwrap();
      setMessage("Shift published as unfilled.");
      void refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not publish"));
    }
  }

  async function handleWithdraw() {
    if (!selected) return;
    setActionError("");
    try {
      await withdraw(selected.id).unwrap();
      setMessage("Offer withdrawn. Shift is unfilled again.");
      void refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not withdraw offer"));
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Matching"
        description="Publish and offer shifts to eligible employees. Hard rules: readiness, availability, and conflicts."
      />

      {message ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
          {message}
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(error, "Could not load shifts.")}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : openShifts.length === 0 ? (
        <div className="dashboard-card px-5 py-12 text-center text-sm text-muted">
          No draft, unfilled, or offered shifts. Create a draft from Schedule first.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <section className="space-y-3 lg:col-span-2">
            <h2 className="text-sm font-semibold text-muted">
              Open shifts ({openShifts.length})
            </h2>
            <ul className="space-y-3">
              {openShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  active={selected?.id === shift.id}
                  onSelect={() => {
                    setSelectedId(shift.id);
                    setMessage("");
                    setActionError("");
                  }}
                />
              ))}
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
                    Candidates · {selected.participantName}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatLongDate(selected.date)} ·{" "}
                    {formatShiftTime(selected.startTime, selected.endTime)} ·{" "}
                    {selected.serviceTitle}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ShiftStatusPill status={selected.status} />
                    {selected.status === "DRAFT" ? (
                      <button
                        type="button"
                        className="btn-secondary !rounded-lg !px-3 !py-1.5 text-xs"
                        disabled={busy}
                        onClick={() => void handlePublishEmpty()}
                      >
                        Publish unfilled
                      </button>
                    ) : null}
                    {selected.status === "OFFERED" ? (
                      <button
                        type="button"
                        className="btn-secondary !rounded-lg !px-3 !py-1.5 text-xs"
                        disabled={busy}
                        onClick={() => void handleWithdraw()}
                      >
                        Withdraw offer
                      </button>
                    ) : null}
                  </div>
                  {selected.status === "OFFERED" && selected.offeredWorkerName ? (
                    <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900">
                      Offer pending: {selected.offeredWorkerName}
                    </p>
                  ) : null}
                </div>

                {loadingCandidates ? (
                  <p className="px-5 py-8 text-sm text-muted">Loading candidates…</p>
                ) : candidates.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-muted">
                    No employees found. Invite and verify employees first.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {candidates.map((row) => {
                      const isPendingOffer = selected.offeredWorkerId === row.workerId;
                      const offerLocked = selected.status === "OFFERED";
                      const canOffer = row.eligible && !offerLocked;

                      return (
                        <li
                          key={row.workerId}
                          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{row.displayName}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Chip
                                ok={row.complianceOk}
                                okLabel="Ready"
                                badLabel="Not ready"
                              />
                              <AvailChip level={row.availability} />
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
                                disabled={!canOffer || busy}
                                onClick={() => void handleOffer(row.workerId)}
                                className={`btn-primary !px-3 !py-2 ${
                                  !canOffer || busy ? "cursor-not-allowed opacity-40" : ""
                                }`}
                              >
                                Publish & offer
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ShiftCard({
  shift,
  active,
  onSelect,
}: {
  shift: ScheduleShift;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
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
        {formatLongDate(shift.date)} · {formatShiftTime(shift.startTime, shift.endTime)}
      </p>
      <p className="mt-1 text-xs text-muted">
        {formatDuration(shift.durationMinutes)} · {shift.serviceLine} · {shift.serviceTitle}
      </p>
    </button>
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

function AvailChip({ level }: { level: "FULL" | "PARTIAL" | "UNAVAILABLE" }) {
  if (level === "FULL") {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        Fully available
      </span>
    );
  }
  if (level === "PARTIAL") {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        Partially available
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
      Unavailable
    </span>
  );
}

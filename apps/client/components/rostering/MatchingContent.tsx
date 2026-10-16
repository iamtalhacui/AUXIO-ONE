"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  useBroadcastScheduleShiftMutation,
  useListMatchCandidatesQuery,
  useListScheduleShiftsQuery,
  usePublishOfferShiftMutation,
  useWithdrawShiftOfferMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import { useToast } from "@/components/toast/ToastProvider";
import type { ScheduleShift } from "@/lib/api/types";
import {
  formatDuration,
  formatLongDate,
  formatShiftTime,
  todayIso,
} from "@/lib/rostering/format";

/**
 * Matching board: pick a draft/unfilled/broadcast shift, then either
 * direct-assign an eligible worker or broadcast to all active employees.
 */
export function MatchingContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialShift = searchParams.get("shift");

  // Load a wide window so open shifts across the week appear.
  const from = todayIso();
  const to = (() => {
    const d = new Date(`${from}T12:00:00`);
    d.setDate(d.getDate() + 28);
    return d.toISOString().slice(0, 10);
  })();

  const { data: allShifts = [], isLoading, error, refetch } = useListScheduleShiftsQuery(
    {
      from: (() => {
        const d = new Date(`${from}T12:00:00`);
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
      })(),
      to,
    },
    { pollingInterval: LIVE_POLL_MS.lists },
  );

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
  const [broadcastShift, broadcastState] = useBroadcastScheduleShiftMutation();
  const [withdraw, withdrawState] = useWithdrawShiftOfferMutation();

  const busy =
    offerState.isLoading || broadcastState.isLoading || withdrawState.isLoading;

  const isBroadcastOpen =
    selected?.status === "OFFERED" && selected.isBroadcast;
  const eligibleCount = candidates.filter((row) => row.eligible).length;

  async function handleAssign(workerId: string) {
    if (!selected) return;
    setActionError("");
    try {
      await publishOffer({ id: selected.id, workerId }).unwrap();
      toast({
        variant: "success",
        title: "Worker assigned",
        description: "Shift is scheduled — no employee acceptance required.",
      });
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not assign worker");
      setActionError(message);
      toast({ variant: "error", title: "Could not assign worker", description: message });
    }
  }

  async function handleBroadcast() {
    if (!selected) return;
    setActionError("");
    const rebroadcast = isBroadcastOpen;
    try {
      await broadcastShift(selected.id).unwrap();
      toast({
        variant: "success",
        title: rebroadcast ? "Broadcast sent again" : "Shift broadcast",
        description:
          "All active employees can see this open shift. First eligible accept wins.",
      });
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not broadcast shift");
      setActionError(message);
      toast({ variant: "error", title: "Could not broadcast shift", description: message });
    }
  }

  async function handleWithdraw() {
    if (!selected) return;
    setActionError("");
    try {
      await withdraw(selected.id).unwrap();
      toast({
        variant: "success",
        title: "Broadcast withdrawn",
        description: "Shift is unfilled again. You can assign or broadcast.",
      });
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not withdraw broadcast");
      setActionError(message);
      toast({ variant: "error", title: "Could not withdraw broadcast", description: message });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Matching"
        description="Direct-assign an eligible employee, or broadcast to all active employees. Hard rules are re-checked when someone accepts a broadcast."
      />

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
                    {isBroadcastOpen ? (
                      <>
                        <button
                          type="button"
                          className="btn-secondary !rounded-lg !px-3 !py-1.5 text-xs"
                          disabled={busy}
                          onClick={() => void handleBroadcast()}
                        >
                          Rebroadcast
                        </button>
                        <button
                          type="button"
                          className="btn-secondary !rounded-lg !px-3 !py-1.5 text-xs"
                          disabled={busy}
                          onClick={() => void handleWithdraw()}
                        >
                          Withdraw broadcast
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary !rounded-lg !px-3 !py-1.5 text-xs"
                        disabled={busy}
                        onClick={() => void handleBroadcast()}
                      >
                        Broadcast to all employees
                      </button>
                    )}
                  </div>
                  {isBroadcastOpen ? (
                    <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900">
                      Broadcast open — all active employees can see it. First eligible accept
                      wins. You can still assign someone below, withdraw, or rebroadcast.
                    </p>
                  ) : eligibleCount === 0 && !loadingCandidates ? (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                      No eligible workers right now. Broadcast anyway — someone marked
                      unavailable can update their availability and accept.
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-muted">
                      Assign locks the shift immediately. Broadcast lets any active employee
                      claim it (first eligible accept wins).
                    </p>
                  )}
                </div>

                {loadingCandidates ? (
                  <p className="px-5 py-8 text-sm text-muted">Loading candidates…</p>
                ) : candidates.length === 0 ? (
                  <div className="space-y-3 px-5 py-8">
                    <p className="text-sm text-muted">
                      No employees found. Invite and verify employees first, or broadcast if
                      workers already exist but are not listed yet.
                    </p>
                    {!isBroadcastOpen ? (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy}
                        onClick={() => void handleBroadcast()}
                      >
                        Broadcast to all employees
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {candidates.map((row) => {
                      const canAssign = row.eligible;

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
                            <button
                              type="button"
                              disabled={!canAssign || busy}
                              onClick={() => void handleAssign(row.workerId)}
                              className={`btn-primary !px-3 !py-2 ${
                                !canAssign || busy ? "cursor-not-allowed opacity-40" : ""
                              }`}
                            >
                              Assign
                            </button>
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
        <div className="flex flex-col items-end gap-1">
          <ShiftStatusPill status={shift.status} />
          {shift.isBroadcast && shift.status === "OFFERED" ? (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              Broadcast
            </span>
          ) : null}
        </div>
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

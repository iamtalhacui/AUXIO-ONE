"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  useApprovePendingShiftMutation,
  useListPendingShiftApprovalsQuery,
  useRejectPendingShiftMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import { useToast } from "@/components/toast/ToastProvider";
import type { ScheduleShift } from "@/lib/api/types";
import {
  formatDuration,
  formatLongDate,
  formatShiftTime,
} from "@/lib/rostering/format";

/**
 * Manager queue for shifts finished outside allowed start/end time windows.
 */
export function ShiftApprovalsContent() {
  const { toast } = useToast();
  const { data: shifts = [], isLoading, error, refetch } =
    useListPendingShiftApprovalsQuery(undefined, {
      pollingInterval: LIVE_POLL_MS.lists,
    });
  const [approve, approveState] = useApprovePendingShiftMutation();
  const [reject, rejectState] = useRejectPendingShiftMutation();
  const [selected, setSelected] = useState<ScheduleShift | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionError, setActionError] = useState("");

  const busy = approveState.isLoading || rejectState.isLoading;

  async function handleApprove() {
    if (!selected) return;
    setActionError("");
    try {
      await approve({
        id: selected.id,
        reviewNote: reviewNote.trim() || undefined,
      }).unwrap();
      toast({ variant: "success", title: "Shift approved" });
      setSelected(null);
      setReviewNote("");
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not approve");
      setActionError(message);
      toast({ variant: "error", title: "Could not approve", description: message });
    }
  }

  async function handleReject() {
    if (!selected) return;
    setActionError("");
    if (reviewNote.trim().length < 3) {
      setActionError("A review note is required when rejecting.");
      return;
    }
    try {
      await reject({ id: selected.id, reviewNote: reviewNote.trim() }).unwrap();
      toast({ variant: "success", title: "Shift rejected" });
      setSelected(null);
      setReviewNote("");
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not reject");
      setActionError(message);
      toast({ variant: "error", title: "Could not reject", description: message });
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading approvals…</p>;
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load pending approvals.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Shift approvals"
        description="Shifts finished outside the allowed start/end windows (start 30 min early–15 min late; end up to 30 min early or half the shift, and 15 min late) need your approve or reject."
      />

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      ) : null}

      {shifts.length === 0 ? (
        <div className="dashboard-card px-5 py-12 text-center text-sm text-muted">
          No shifts waiting for approval.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <ul className="space-y-3 lg:col-span-2">
            {shifts.map((shift) => (
              <li key={shift.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(shift);
                    setReviewNote("");
                    setActionError("");
                  }}
                  className={`w-full rounded-xl border px-4 py-3.5 text-left transition ${
                    selected?.id === shift.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-surface hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{shift.participantName}</p>
                    <ShiftStatusPill status={shift.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatLongDate(shift.date)} ·{" "}
                    {formatShiftTime(shift.startTime, shift.endTime)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {shift.assignedWorkerName ?? "Worker"} · end variance{" "}
                    {shift.endVarianceMinutes ?? "—"} min
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <section className="dashboard-card lg:col-span-3">
            {!selected ? (
              <p className="px-5 py-12 text-center text-sm text-muted">
                Select a shift to review.
              </p>
            ) : (
              <div className="space-y-4 p-5">
                <div>
                  <h2 className="text-lg font-semibold">{selected.participantName}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {selected.serviceTitle} · {selected.serviceLine}
                  </p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-xs uppercase text-muted">Scheduled</dt>
                    <dd className="mt-1 font-medium">
                      {formatShiftTime(selected.startTime, selected.endTime)} (
                      {formatDuration(selected.durationMinutes)})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted">Worker</dt>
                    <dd className="mt-1 font-medium">
                      {selected.assignedWorkerName ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted">Actual start</dt>
                    <dd className="mt-1 font-medium">
                      {selected.actualStartedAt
                        ? new Date(selected.actualStartedAt).toLocaleString("en-AU")
                        : "—"}
                      {selected.startVarianceMinutes != null
                        ? ` (${selected.startVarianceMinutes} min)`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted">Actual end</dt>
                    <dd className="mt-1 font-medium">
                      {selected.actualEndedAt
                        ? new Date(selected.actualEndedAt).toLocaleString("en-AU")
                        : "—"}
                      {selected.endVarianceMinutes != null
                        ? ` (${selected.endVarianceMinutes} min)`
                        : ""}
                    </dd>
                  </div>
                </dl>

                <div>
                  <p className="text-xs font-semibold uppercase text-muted">Finish reason</p>
                  <p className="mt-1 text-sm">{selected.finishReason || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted">Progress note</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {selected.progressNote || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-muted">Tasks</p>
                  <ul className="mt-2 space-y-1">
                    {selected.tasks.map((t) => (
                      <li key={t.id} className="text-sm">
                        {t.completedAt ? "✓" : "○"} {t.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="input-label" htmlFor="review-note">
                    Review note (required to reject)
                  </label>
                  <textarea
                    id="review-note"
                    className="input-field min-h-[80px]"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => void handleApprove()}
                  >
                    {approveState.isLoading ? "Approving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void handleReject()}
                  >
                    {rejectState.isLoading ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

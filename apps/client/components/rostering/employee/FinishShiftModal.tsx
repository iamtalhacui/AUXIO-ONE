"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { ScheduleShift } from "@/lib/api/types";
import {
  EARLY_START_ALLOW_MINUTES,
  LATE_END_ALLOW_MINUTES,
  LATE_START_APPROVAL_MINUTES,
  type ShiftClock,
} from "@/lib/rostering/useShiftClock";
import { formatClock, formatElapsed, formatVariance } from "@/lib/rostering/format";

type Props = {
  open: boolean;
  shift: ScheduleShift;
  clock: ShiftClock;
  busy: boolean;
  onClose: () => void;
  onConfirm: (finishReason?: string) => Promise<void>;
};

function startNeedsApproval(minutes: number | null): boolean {
  if (minutes === null) return false;
  return minutes > LATE_START_APPROVAL_MINUTES || minutes < -EARLY_START_ALLOW_MINUTES;
}

function endNeedsApproval(minutes: number | null, earlyEndAllow: number): boolean {
  if (minutes === null) return false;
  return minutes < -earlyEndAllow || minutes > LATE_END_ALLOW_MINUTES;
}

export function FinishShiftModal({
  open,
  shift,
  clock,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const needsReason = clock.outsideMargin;
  const earlyEndAllow = clock.earlyEndAllowMinutes;

  async function handleConfirm() {
    if (needsReason && reason.trim().length < 3) {
      setError(
        `A reason is required when you start more than ${LATE_START_APPROVAL_MINUTES} minutes late, finish more than ${earlyEndAllow} minutes early, or finish more than ${LATE_END_ALLOW_MINUTES} minutes after the scheduled end.`,
      );
      return;
    }
    setError("");
    await onConfirm(needsReason ? reason.trim() : undefined);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finish shift"
      description="Check your times before submitting. This ends the shift."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Keep working
          </button>
          <button
            type="button"
            className="btn-primary disabled:opacity-50"
            onClick={() => void handleConfirm()}
            disabled={busy}
          >
            {busy ? "Finishing…" : "Finish shift"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-border/60">
          <SummaryRow
            label="Scheduled"
            value={`${shift.startTime} – ${shift.endTime}`}
          />
          <SummaryRow
            label="Actual"
            value={`${
              shift.actualStartedAt
                ? formatClock(shift.actualStartedAt, clock.timeZone)
                : "—"
            } – now`}
          />
          <SummaryRow label="Time worked" value={formatElapsed(clock.elapsedMs)} />
          <SummaryRow
            label="Start variance"
            value={
              clock.startVarianceMinutes === null
                ? "—"
                : formatVariance(clock.startVarianceMinutes)
            }
            tone={startNeedsApproval(clock.startVarianceMinutes) ? "warn" : "ok"}
          />
          <SummaryRow
            label="End variance"
            value={
              clock.endVarianceMinutes === null
                ? "—"
                : formatVariance(clock.endVarianceMinutes)
            }
            tone={
              endNeedsApproval(clock.endVarianceMinutes, earlyEndAllow) ? "warn" : "ok"
            }
          />
        </div>

        <div
          className={`rounded-lg border px-3.5 py-3 text-sm ${
            needsReason
              ? "border-orange-200 bg-orange-50 text-orange-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {needsReason
            ? `Approval required — start must be within ${EARLY_START_ALLOW_MINUTES} min early / ${LATE_START_APPROVAL_MINUTES} min late, and end within ${earlyEndAllow} min early / ${LATE_END_ALLOW_MINUTES} min late. This shift goes to your Manager.`
            : `Within allowed windows — start within ${EARLY_START_ALLOW_MINUTES} min early / ${LATE_START_APPROVAL_MINUTES} min late, end within ${earlyEndAllow} min early / ${LATE_END_ALLOW_MINUTES} min late. Auto-approved on finish.`}
        </div>

        {needsReason ? (
          <div>
            <label className="input-label" htmlFor="finish-reason">
              Reason for the time difference
            </label>
            <textarea
              id="finish-reason"
              className="input-field min-h-[96px]"
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Participant appointment ran late, so I stayed until family arrived."
            />
          </div>
        ) : null}

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </Modal>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 px-3.5 py-2.5 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          tone === "warn"
            ? "text-orange-700"
            : tone === "ok"
              ? "text-emerald-700"
              : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

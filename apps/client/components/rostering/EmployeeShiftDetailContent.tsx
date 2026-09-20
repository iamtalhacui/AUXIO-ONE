"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  useCompleteMyShiftTaskMutation,
  useFinishMyShiftMutation,
  useGetMyShiftQuery,
  useSaveMyProgressNoteMutation,
  useStartMyShiftMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import {
  formatDuration,
  formatLongDate,
  formatShiftTime,
} from "@/lib/rostering/format";

/** ±15 minute margin — matches server VARIANCE_MARGIN_MINUTES. */
const VARIANCE_MARGIN_MINUTES = 15;

/**
 * Employee shift detail + Phase B execution:
 * Start → complete tasks + progress note → Finish (auto-approve or pending Org Admin).
 */
export function EmployeeShiftDetailContent({ shiftId }: { shiftId: string }) {
  const { toast } = useToast();
  const { data: shift, isLoading, error, refetch } = useGetMyShiftQuery(shiftId);
  const [start, startState] = useStartMyShiftMutation();
  const [completeTask, taskState] = useCompleteMyShiftTaskMutation();
  const [saveNote, noteState] = useSaveMyProgressNoteMutation();
  const [finish, finishState] = useFinishMyShiftMutation();

  const [progressNote, setProgressNote] = useState("");
  const [finishReason, setFinishReason] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (shift?.progressNote != null) setProgressNote(shift.progressNote);
  }, [shift?.progressNote]);

  const overdue = useMemo(() => {
    if (!shift || shift.status !== "IN_PROGRESS") return false;
    const end = new Date(`${shift.date}T${shift.endTime}:00`);
    return Date.now() > end.getTime();
  }, [shift]);

  const variancePreview = useMemo(() => {
    if (!shift || shift.status !== "IN_PROGRESS" || !shift.actualStartedAt) {
      return null;
    }
    const scheduledStart = new Date(`${shift.date}T${shift.startTime}:00`);
    const scheduledEnd = new Date(`${shift.date}T${shift.endTime}:00`);
    const actualStart = new Date(shift.actualStartedAt);
    const now = new Date();
    const startVar = Math.round((actualStart.getTime() - scheduledStart.getTime()) / 60000);
    const endVar = Math.round((now.getTime() - scheduledEnd.getTime()) / 60000);
    const outside =
      Math.abs(startVar) > VARIANCE_MARGIN_MINUTES ||
      Math.abs(endVar) > VARIANCE_MARGIN_MINUTES;
    return { startVar, endVar, outside };
  }, [shift]);

  const requiredRemaining =
    shift?.tasks.filter((t) => t.required && !t.completedAt).length ?? 0;

  const busy =
    startState.isLoading ||
    taskState.isLoading ||
    noteState.isLoading ||
    finishState.isLoading;

  async function handleStart() {
    setActionError("");
    try {
      await start(shiftId).unwrap();
      toast({
        variant: "success",
        title: "Shift started",
        description: "Complete your tasks and progress note.",
      });
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not start shift");
      setActionError(message);
      toast({ variant: "error", title: "Could not start shift", description: message });
    }
  }

  async function handleCompleteTask(taskId: string) {
    setActionError("");
    try {
      await completeTask({ shiftId, taskId }).unwrap();
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not complete task");
      setActionError(message);
      toast({ variant: "error", title: "Could not complete task", description: message });
    }
  }

  async function handleSaveNote() {
    setActionError("");
    try {
      await saveNote({ shiftId, progressNote }).unwrap();
      toast({ variant: "success", title: "Progress note saved" });
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not save note");
      setActionError(message);
      toast({ variant: "error", title: "Could not save note", description: message });
    }
  }

  async function handleFinish() {
    setActionError("");
    if (variancePreview?.outside && finishReason.trim().length < 3) {
      setActionError(
        `A reason is required when time is more than ${VARIANCE_MARGIN_MINUTES} minutes early or late.`,
      );
      return;
    }
    try {
      const result = await finish({
        shiftId,
        finishReason: variancePreview?.outside ? finishReason.trim() : undefined,
      }).unwrap();
      toast({
        variant: "success",
        title: "Shift finished",
        description:
          result.status === "APPROVED"
            ? "Auto-approved (within ±15 minutes)."
            : "Waiting for Org Admin approval.",
      });
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not finish shift");
      setActionError(message);
      toast({ variant: "error", title: "Could not finish shift", description: message });
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading shift…</p>;
  }

  if (error || !shift) {
    return (
      <div className="space-y-4">
        <Link
          href="/employee/shifts"
          className="inline-flex text-sm font-semibold text-primary hover:underline"
        >
          ← Back to shifts
        </Link>
        <p className="text-sm text-red-600">
          {getErrorMessage(error, "Shift not found.")}
        </p>
      </div>
    );
  }

  const canExecute = shift.status === "ACCEPTED" || shift.status === "IN_PROGRESS";
  const inProgress = shift.status === "IN_PROGRESS";

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

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </div>
      ) : null}
      {overdue ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          This shift is past its scheduled end. Finish when care is complete — a reason will be
          required if you are more than {VARIANCE_MARGIN_MINUTES} minutes late.
        </div>
      ) : null}

      <section className="dashboard-card divide-y divide-border/40">
        <DetailRow label="Time" value={formatShiftTime(shift.startTime, shift.endTime)} />
        <DetailRow label="Duration" value={formatDuration(shift.durationMinutes)} />
        <DetailRow label="Location" value={shift.locationLabel} />
        <DetailRow
          label="Service"
          value={`${shift.serviceTitle} (${shift.serviceLine})`}
        />
        <DetailRow label="Planning notes" value={shift.notes || "No planning notes."} />
        {shift.actualStartedAt ? (
          <DetailRow
            label="Actual start"
            value={new Date(shift.actualStartedAt).toLocaleString("en-AU")}
          />
        ) : null}
        {shift.actualEndedAt ? (
          <DetailRow
            label="Actual end"
            value={new Date(shift.actualEndedAt).toLocaleString("en-AU")}
          />
        ) : null}
        {shift.finishReason ? (
          <DetailRow label="Finish reason" value={shift.finishReason} />
        ) : null}
        {shift.reviewNote ? (
          <DetailRow label="Review note" value={shift.reviewNote} />
        ) : null}
      </section>

      {/* Start (only when accepted) */}
      {shift.status === "ACCEPTED" ? (
        <section className="dashboard-card p-5">
          <h2 className="text-base font-semibold">Start shift</h2>
          <p className="mt-1 text-sm text-muted">
            Tasks and progress notes stay locked until you start. Start time is recorded by the
            server.
          </p>
          <button
            type="button"
            className="btn-primary mt-4"
            disabled={busy}
            onClick={() => void handleStart()}
          >
            {startState.isLoading ? "Starting…" : "Start shift"}
          </button>
        </section>
      ) : null}

      {/* Tasks — read-only before start */}
      <section className="dashboard-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Required tasks</h2>
          <p className="mt-0.5 text-sm text-muted">
            {inProgress
              ? `${requiredRemaining} remaining`
              : canExecute
                ? "Available after you start the shift"
                : "Task checklist for this service line"}
          </p>
        </div>
        <ul className="divide-y divide-border/40">
          {(shift.tasks ?? []).length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted">No tasks on this shift.</li>
          ) : (
            shift.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium">{task.label}</p>
                  {task.completedAt ? (
                    <p className="mt-0.5 text-xs text-muted">
                      Done · {new Date(task.completedAt).toLocaleString("en-AU")}
                    </p>
                  ) : null}
                </div>
                {task.completedAt ? (
                  <span className="status-pill bg-emerald-50 text-emerald-700">Done</span>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary !rounded-lg !px-3 !py-1.5 text-xs disabled:opacity-40"
                    disabled={!inProgress || busy}
                    onClick={() => void handleCompleteTask(task.id)}
                  >
                    Mark done
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Progress note */}
      <section className="dashboard-card p-5">
        <h2 className="text-base font-semibold">Progress note</h2>
        <p className="mt-1 text-sm text-muted">
          {inProgress
            ? "Write what happened during this shift."
            : "Editable only while the shift is in progress."}
        </p>
        <textarea
          className="input-field mt-3 min-h-[100px]"
          value={progressNote}
          disabled={!inProgress || busy}
          onChange={(e) => setProgressNote(e.target.value)}
          placeholder="Progress note…"
        />
        {inProgress ? (
          <button
            type="button"
            className="btn-secondary mt-3 !rounded-lg"
            disabled={busy}
            onClick={() => void handleSaveNote()}
          >
            {noteState.isLoading ? "Saving…" : "Save note"}
          </button>
        ) : null}
      </section>

      {/* Finish */}
      {inProgress ? (
        <section className="dashboard-card space-y-3 p-5">
          <h2 className="text-base font-semibold">Finish shift</h2>
          <p className="text-sm text-muted">
            Within ±{VARIANCE_MARGIN_MINUTES} minutes of scheduled start and end, the shift is
            auto-approved. Outside that margin, a reason is required and Org Admin must approve or
            reject.
          </p>
          {variancePreview?.outside ? (
            <div>
              <label className="input-label" htmlFor="finish-reason">
                Reason (required)
              </label>
              <textarea
                id="finish-reason"
                className="input-field min-h-[80px]"
                value={finishReason}
                onChange={(e) => setFinishReason(e.target.value)}
                placeholder="Explain why the shift time is outside the ±15 minute margin"
              />
            </div>
          ) : null}
          {requiredRemaining > 0 ? (
            <p className="text-sm font-medium text-amber-800">
              Complete {requiredRemaining} required task
              {requiredRemaining === 1 ? "" : "s"} before finishing.
            </p>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            disabled={busy || requiredRemaining > 0}
            onClick={() => void handleFinish()}
          >
            {finishState.isLoading ? "Finishing…" : "Finish shift"}
          </button>
        </section>
      ) : null}

      {shift.customerId ? (
        <Link
          href={`/employee/participants/${shift.customerId}`}
          className="dashboard-card block px-5 py-4 transition hover:border-primary/30"
        >
          <p className="text-sm font-semibold text-primary">View care summary</p>
          <p className="mt-1 text-xs text-muted">
            Support summary, plan period, emergency contact, goals and risks.
          </p>
        </Link>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="whitespace-pre-wrap text-sm font-medium sm:max-w-[60%] sm:text-right">
        {value}
      </p>
    </div>
  );
}

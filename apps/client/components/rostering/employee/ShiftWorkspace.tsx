"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  useAcceptShiftOfferMutation,
  useCompleteMyShiftTaskMutation,
  useDeclineShiftOfferMutation,
  useFinishMyShiftMutation,
  useGetMyShiftQuery,
  useSaveMyProgressNoteMutation,
  useStartMyShiftMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import { useToast } from "@/components/toast/ToastProvider";
import {
  EARLY_START_ALLOW_MINUTES,
  LATE_END_ALLOW_MINUTES,
  useShiftClock,
} from "@/lib/rostering/useShiftClock";
import { formatLongDate, formatShiftTime } from "@/lib/rostering/format";
import { auTimezoneLabel } from "@/lib/timezones/au";
import { ShiftActionRail } from "./ShiftActionRail";
import { ShiftNotesPanel } from "./ShiftNotesPanel";
import { ShiftPrepPanel } from "./ShiftPrepPanel";
import { ShiftSummaryPanel } from "./ShiftSummaryPanel";
import { ShiftTaskList } from "./ShiftTaskList";
import { FinishShiftModal } from "./FinishShiftModal";

/**
 * A single shift, rendered as a workspace whose shape follows the shift state:
 * offer → brief → active work surface → outcome.
 */
export function ShiftWorkspace({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    data: shift,
    isLoading,
    error,
    refetch,
  } = useGetMyShiftQuery(shiftId, { pollingInterval: LIVE_POLL_MS.lists });

  const [accept, acceptState] = useAcceptShiftOfferMutation();
  const [decline, declineState] = useDeclineShiftOfferMutation();
  const [start, startState] = useStartMyShiftMutation();
  const [completeTask, taskState] = useCompleteMyShiftTaskMutation();
  const [saveNote, noteState] = useSaveMyProgressNoteMutation();
  const [finish, finishState] = useFinishMyShiftMutation();

  const clock = useShiftClock(shift);
  const serverNote = shift?.progressNote ?? "";
  const [note, setNote] = useState(serverNote);
  const [noteDirty, setNoteDirty] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  // Polling refreshes the shift; don't clobber what the employee is typing.
  useEffect(() => {
    if (!noteDirty) setNote(serverNote);
  }, [serverNote, noteDirty]);

  const busy =
    startState.isLoading ||
    taskState.isLoading ||
    noteState.isLoading ||
    finishState.isLoading;
  const responding = acceptState.isLoading || declineState.isLoading;

  function fail(err: unknown, fallback: string) {
    const message = getErrorMessage(err, fallback);
    setActionError(message);
    toast({ variant: "error", title: fallback, description: message });
  }

  async function handleRespond(action: "accept" | "decline") {
    setActionError("");
    try {
      if (action === "accept") await accept(shiftId).unwrap();
      else await decline(shiftId).unwrap();
      toast({
        variant: action === "accept" ? "success" : "info",
        title: action === "accept" ? "Shift accepted" : "Shift declined",
      });
      void refetch();
    } catch (err) {
      fail(err, "Could not update offer");
    }
  }

  async function handleStart() {
    setActionError("");
    if (clock?.startBlockedTooEarly) {
      setActionError(
        `You can start from ${EARLY_START_ALLOW_MINUTES} minutes before the scheduled start (${shift?.startTime ?? "start time"}). Come back closer to the start time.`,
      );
      return;
    }
    try {
      await start(shiftId).unwrap();
      toast({
        variant: "success",
        title: "Shift started",
        description: "Tasks and notes are now unlocked.",
      });
      void refetch();
    } catch (err) {
      fail(err, "Could not start shift");
    }
  }

  async function handleCompleteTask(taskId: string) {
    setActionError("");
    setBusyTaskId(taskId);
    try {
      await completeTask({ shiftId, taskId }).unwrap();
      void refetch();
    } catch (err) {
      fail(err, "Could not complete task");
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleSaveNote(next = note) {
    setActionError("");
    try {
      await saveNote({ shiftId, progressNote: next }).unwrap();
      setNoteDirty(false);
      void refetch();
    } catch (err) {
      fail(err, "Could not save note");
    }
  }

  function openIncidentReport() {
    router.push(`/employee/incidents/report?shiftId=${encodeURIComponent(shiftId)}`);
  }

  async function handleFinish(finishReason?: string) {
    setActionError("");
    try {
      if (noteDirty) await saveNote({ shiftId, progressNote: note }).unwrap();
      const result = await finish({ shiftId, finishReason }).unwrap();
      setNoteDirty(false);
      setFinishOpen(false);
      toast({
        variant: "success",
        title: "Shift finished",
        description:
          result.status === "APPROVED"
            ? "Auto-approved — within allowed start/end time windows."
            : "Sent to your Org Admin for approval.",
      });
      void refetch();
    } catch (err) {
      fail(err, "Could not finish shift");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="dashboard-card h-24 animate-pulse" />
        <div className="dashboard-card h-96 animate-pulse" />
      </div>
    );
  }

  if (error || !shift || !clock) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getErrorMessage(error, "Shift not found.")}
        </p>
      </div>
    );
  }

  const tasks = shift.tasks ?? [];
  const requiredRemaining = tasks.filter((t) => t.required && !t.completedAt).length;
  const live = clock.phase === "active" || clock.phase === "overrun";
  const finished =
    shift.status === "PENDING_APPROVAL" ||
    shift.status === "APPROVED" ||
    shift.status === "REJECTED";

  return (
    <div className="space-y-5">
      <BackLink />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="page-title truncate">{shift.participantName}</h1>
          <p className="page-subtitle">
            {formatLongDate(shift.date)} ·{" "}
            {formatShiftTime(shift.startTime, shift.endTime)} · {shift.serviceTitle}
          </p>
          <p className="mt-1 text-xs font-medium text-primary">
            Times in {auTimezoneLabel(clock.timeZone)}
          </p>
        </div>
        <ShiftStatusPill status={shift.status} audience="employee" />
      </div>

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </p>
      ) : null}

      {clock.phase === "overrun" ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          This shift is past its scheduled end. Finish when care is complete — you will be
          asked for a reason if you are more than {LATE_END_ALLOW_MINUTES} minutes over.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="order-2 space-y-5 lg:order-1">
          {finished ? <ShiftSummaryPanel shift={shift} clock={clock} /> : null}

          {live ? (
            <>
              <ShiftTaskList
                tasks={tasks}
                interactive
                busyTaskId={busyTaskId}
                disabled={busy}
                timeZone={clock.timeZone}
                onComplete={(taskId) => void handleCompleteTask(taskId)}
              />
              <ShiftNotesPanel
                value={note}
                editable
                dirty={noteDirty}
                saving={noteState.isLoading}
                onChange={(value) => {
                  setNote(value);
                  setNoteDirty(true);
                }}
                onSave={() => void handleSaveNote()}
                onReportIncident={openIncidentReport}
              />
              <ShiftPrepPanel shift={shift} collapsible />
            </>
          ) : (
            <>
              <ShiftPrepPanel shift={shift} />
              <ShiftTaskList tasks={tasks} interactive={false} timeZone={clock.timeZone} />
              {finished ? (
                <ShiftNotesPanel
                  value={serverNote}
                  editable={false}
                  dirty={false}
                  saving={false}
                  onChange={() => undefined}
                  onSave={() => undefined}
                  onReportIncident={() => undefined}
                />
              ) : null}
            </>
          )}
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-6">
          <ShiftActionRail
            shift={shift}
            clock={clock}
            requiredRemaining={requiredRemaining}
            busy={busy}
            starting={startState.isLoading}
            responding={responding}
            onAccept={() => void handleRespond("accept")}
            onDecline={() => void handleRespond("decline")}
            onStart={() => void handleStart()}
            onOpenFinish={() => setFinishOpen(true)}
            onReportIncident={live ? openIncidentReport : undefined}
          />
        </div>
      </div>

      <FinishShiftModal
        open={finishOpen}
        shift={shift}
        clock={clock}
        busy={finishState.isLoading || noteState.isLoading}
        onClose={() => setFinishOpen(false)}
        onConfirm={handleFinish}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/employee/shifts"
      className="inline-flex text-sm font-semibold text-primary hover:underline"
    >
      ← Back to shifts
    </Link>
  );
}

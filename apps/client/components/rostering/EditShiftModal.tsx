"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  useCancelScheduleShiftMutation,
  useUpdateScheduleShiftMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import type { ScheduleShift, SeriesEditScope } from "@/lib/api/types";
import { endTimeFromDuration, SERVICE_LINE_OPTIONS } from "@/lib/rostering/format";

type Props = {
  shift: ScheduleShift | null;
  onClose: () => void;
  onSaved: () => void;
};

/** Edit one shift, or this + following shifts in a recurring series. */
export function EditShiftModal({ shift, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [update, updateState] = useUpdateScheduleShiftMutation();
  const [cancel, cancelState] = useCancelScheduleShiftMutation();

  const [serviceLine, setServiceLine] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [seriesScope, setSeriesScope] = useState<SeriesEditScope>("THIS");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shift) return;
    setServiceLine(shift.serviceLine);
    setServiceTitle(shift.serviceTitle);
    setDate(shift.date);
    setStartTime(shift.startTime);
    setHours(Math.floor(shift.durationMinutes / 60));
    setMinutes(shift.durationMinutes % 60);
    setNotes(shift.notes ?? "");
    setLocationLabel(shift.locationLabel);
    setSeriesScope("THIS");
    setError("");
  }, [shift]);

  if (!shift) return null;

  const durationMinutes = hours * 60 + minutes;
  const endTime =
    durationMinutes >= 5 ? endTimeFromDuration(startTime, durationMinutes) : "—";
  const busy = updateState.isLoading || cancelState.isLoading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (durationMinutes < 5 || durationMinutes % 5 !== 0) {
      setError("Duration must be a multiple of 5 minutes.");
      return;
    }
    try {
      await update({
        id: shift!.id,
        serviceLine,
        serviceTitle,
        date: seriesScope === "THIS" ? date : undefined,
        startTime,
        durationMinutes,
        notes,
        locationLabel,
        seriesScope: shift!.seriesId ? seriesScope : "THIS",
      }).unwrap();
      onSaved();
      toast({ variant: "success", title: "Shift updated" });
      onClose();
    } catch (err) {
      const message = getErrorMessage(err, "Could not update shift");
      setError(message);
      toast({ variant: "error", title: "Could not update shift", description: message });
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this shift? This cannot be undone easily.")) return;
    setError("");
    try {
      await cancel(shift!.id).unwrap();
      onSaved();
      toast({ variant: "success", title: "Shift cancelled" });
      onClose();
    } catch (err) {
      const message = getErrorMessage(err, "Could not cancel shift");
      setError(message);
      toast({ variant: "error", title: "Could not cancel shift", description: message });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-labelledby="edit-shift-title"
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-border/50 bg-surface px-5 py-4">
          <div>
            <h2 id="edit-shift-title" className="text-lg font-semibold">
              Edit shift
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {shift.participantName} · {shift.status}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-muted"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label className="input-label" htmlFor="edit-location">
              Location
            </label>
            <input
              id="edit-location"
              className="input-field"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="edit-line">
              Service line
            </label>
            <select
              id="edit-line"
              className="input-field"
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value)}
            >
              {[serviceLine, ...SERVICE_LINE_OPTIONS.filter((s) => s !== serviceLine)].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="input-label" htmlFor="edit-title">
              Service title
            </label>
            <input
              id="edit-title"
              className="input-field"
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="input-label" htmlFor="edit-date">
                Date
              </label>
              <input
                id="edit-date"
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={seriesScope === "THIS_AND_FOLLOWING"}
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="edit-start">
                Start time
              </label>
              <input
                id="edit-start"
                type="time"
                step={300}
                className="input-field"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="input-label" htmlFor="edit-h">
                Hours
              </label>
              <input
                id="edit-h"
                type="number"
                min={0}
                className="input-field"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="edit-m">
                Minutes
              </label>
              <select
                id="edit-m"
                className="input-field"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="input-label">End time</p>
              <p className="rounded-lg border border-border/60 bg-surface-subtle px-3.5 py-2.5 text-sm font-medium">
                {endTime}
              </p>
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="edit-notes">
              Notes
            </label>
            <textarea
              id="edit-notes"
              className="input-field min-h-[72px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {shift.seriesId ? (
            <fieldset className="rounded-xl border border-border/60 px-4 py-3">
              <legend className="px-1 text-sm font-semibold">Apply changes to</legend>
              <label className="mt-2 flex items-center gap-3">
                <input
                  type="radio"
                  name="seriesScope"
                  checked={seriesScope === "THIS"}
                  onChange={() => setSeriesScope("THIS")}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">This shift only</span>
              </label>
              <label className="mt-2 flex items-center gap-3">
                <input
                  type="radio"
                  name="seriesScope"
                  checked={seriesScope === "THIS_AND_FOLLOWING"}
                  onChange={() => setSeriesScope("THIS_AND_FOLLOWING")}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">This and following shifts in the series</span>
              </label>
              <p className="mt-2 text-xs text-muted">
                Completed and cancelled shifts are never changed.
              </p>
            </fieldset>
          ) : null}

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="button"
              className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={() => void handleCancel()}
            >
              Cancel shift
            </button>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary !rounded-lg" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {updateState.isLoading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  useCancelScheduleShiftMutation,
  useGetOrganisationQuery,
  useUpdateScheduleShiftMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { ConstrainedDateInput } from "@/components/ui/ConstrainedDateInput";
import { ConstrainedSelect } from "@/components/ui/ConstrainedSelect";
import { ConstrainedTimeInput } from "@/components/ui/ConstrainedTimeInput";
import { useToast } from "@/components/toast/ToastProvider";
import type { ScheduleShift, SeriesEditScope } from "@/lib/api/types";
import {
  durationMinutesFromTimes,
  endTimeFromDuration,
  SERVICE_LINE_OPTIONS,
  snapDurationMinutes,
} from "@/lib/rostering/format";
import { auTimezoneLabel } from "@/lib/timezones/au";

type Props = {
  shift: ScheduleShift | null;
  onClose: () => void;
  onSaved: () => void;
};

/** Edit one shift, or this + following shifts in a recurring series. */
export function EditShiftModal({ shift, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const { data: org } = useGetOrganisationQuery(undefined, { skip: !shift });
  const timeZoneLabel = auTimezoneLabel(org?.timezone);
  const [update, updateState] = useUpdateScheduleShiftMutation();
  const [cancel, cancelState] = useCancelScheduleShiftMutation();

  const [serviceLine, setServiceLine] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [endTime, setEndTime] = useState("");
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
    setEndTime(endTimeFromDuration(shift.startTime, shift.durationMinutes));
    setNotes(shift.notes ?? "");
    setLocationLabel(shift.locationLabel);
    setSeriesScope("THIS");
    setError("");
  }, [shift]);

  if (!shift) return null;

  const durationMinutes = hours * 60 + minutes;
  const busy = updateState.isLoading || cancelState.isLoading;

  function setDurationFromParts(nextHours: number, nextMinutes: number) {
    const h = Math.max(0, Math.min(23, Number.isFinite(nextHours) ? nextHours : 0));
    const m = nextMinutes;
    setHours(h);
    setMinutes(m);
    const dur = h * 60 + m;
    if (dur >= 5) setEndTime(endTimeFromDuration(startTime, dur));
  }

  function setEndTimeAndDuration(nextEnd: string) {
    setEndTime(nextEnd);
    if (!nextEnd || !startTime) return;
    const snapped = snapDurationMinutes(durationMinutesFromTimes(startTime, nextEnd));
    setHours(Math.floor(snapped / 60));
    setMinutes(snapped % 60);
    setEndTime(endTimeFromDuration(startTime, snapped));
  }

  function setStartTimeKeepingDuration(nextStart: string) {
    setStartTime(nextStart);
    const dur = hours * 60 + minutes;
    if (dur >= 5) setEndTime(endTimeFromDuration(nextStart, dur));
  }

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[min(92vh,720px)] w-full min-w-0 max-w-lg overflow-x-hidden overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-xl sm:rounded-2xl"
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
            <p className="mt-1 text-xs font-medium text-primary">
              All times are in {timeZoneLabel}
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

        <form onSubmit={handleSubmit} className="min-w-0 space-y-4 px-4 py-5 sm:px-5">
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
            <ConstrainedSelect
              id="edit-line"
              aria-label="Service line"
              value={serviceLine}
              onChange={setServiceLine}
              options={[
                serviceLine,
                ...SERVICE_LINE_OPTIONS.filter((s) => s !== serviceLine),
              ]
                .filter(Boolean)
                .map((s) => ({ value: s, label: s }))}
            />
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

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="input-label" htmlFor="edit-date">
                Date
              </label>
              <ConstrainedDateInput
                id="edit-date"
                aria-label="Shift date"
                value={date}
                onChange={setDate}
                disabled={seriesScope === "THIS_AND_FOLLOWING"}
              />
            </div>
            <div className="min-w-0">
              <label className="input-label" htmlFor="edit-start">
                Start time
              </label>
              <ConstrainedTimeInput
                id="edit-start"
                aria-label="Start time"
                value={startTime}
                onChange={setStartTimeKeepingDuration}
              />
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="min-w-0">
              <label className="input-label" htmlFor="edit-h">
                Hours
              </label>
              <input
                id="edit-h"
                type="number"
                min={0}
                max={23}
                inputMode="numeric"
                className="input-field"
                value={hours}
                onChange={(e) => setDurationFromParts(Number(e.target.value), minutes)}
              />
            </div>
            <div className="min-w-0">
              <label className="input-label" htmlFor="edit-m">
                Minutes
              </label>
              <ConstrainedSelect
                id="edit-m"
                aria-label="Minutes"
                value={String(minutes)}
                onChange={(next) => setDurationFromParts(hours, Number(next))}
                options={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
                  value: String(m),
                  label: String(m),
                }))}
              />
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <label className="input-label" htmlFor="edit-end">
                End time
              </label>
              <ConstrainedTimeInput
                id="edit-end"
                aria-label="End time"
                value={endTime}
                onChange={setEndTimeAndDuration}
              />
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

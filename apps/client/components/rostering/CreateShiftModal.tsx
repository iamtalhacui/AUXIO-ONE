"use client";

import { useEffect, useState } from "react";
import {
  useCreateScheduleShiftsMutation,
  useListScheduleParticipantsQuery,
  usePreviewRecurrenceMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import type {
  CreateScheduleShiftRequest,
  RecurrenceFrequency,
  ShiftLocationKind,
} from "@/lib/api/types";
import {
  durationMinutesFromTimes,
  endTimeFromDuration,
  SERVICE_LINE_OPTIONS,
  snapDurationMinutes,
} from "@/lib/rostering/format";

type Props = {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onCreated: (count: number) => void;
};

/**
 * Create one draft shift or a recurring series.
 * Filling (direct assign or broadcast) happens from Matching.
 */
export function CreateShiftModal({ open, defaultDate, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const { data: participants = [], isLoading: loadingParticipants } =
    useListScheduleParticipantsQuery(undefined, { skip: !open });
  const [preview, previewState] = usePreviewRecurrenceMutation();
  const [create, createState] = useCreateScheduleShiftsMutation();

  const [locationKind, setLocationKind] = useState<ShiftLocationKind>("PARTICIPANT");
  const [customerId, setCustomerId] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [serviceLine, setServiceLine] = useState(SERVICE_LINE_OPTIONS[0]);
  const [serviceTitle, setServiceTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [hours, setHours] = useState(4);
  const [minutes, setMinutes] = useState(0);
  const [endTime, setEndTime] = useState(() => endTimeFromDuration("09:00", 4 * 60));
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("WEEKLY");
  const [interval, setInterval] = useState(1);
  const [untilDate, setUntilDate] = useState("");
  const [previewResult, setPreviewResult] = useState<{ count: number; dates: string[] } | null>(
    null,
  );
  const [error, setError] = useState("");

  const durationMinutes = hours * 60 + minutes;

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
    if (!nextEnd) return;
    const snapped = snapDurationMinutes(durationMinutesFromTimes(startTime, nextEnd));
    setHours(Math.floor(snapped / 60));
    setMinutes(snapped % 60);
    // Keep end aligned to the snapped duration (5-minute steps).
    setEndTime(endTimeFromDuration(startTime, snapped));
  }

  function setStartTimeKeepingDuration(nextStart: string) {
    setStartTime(nextStart);
    const dur = hours * 60 + minutes;
    if (dur >= 5) setEndTime(endTimeFromDuration(nextStart, dur));
  }

  // Reset form each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setDate(defaultDate);
    setError("");
    setPreviewResult(null);
    setRecurring(false);
    setServiceTitle("");
    setNotes("");
    setHours(4);
    setMinutes(0);
    setStartTime("09:00");
    setEndTime(endTimeFromDuration("09:00", 4 * 60));
    setLocationKind("PARTICIPANT");
    setCustomerId("");
    setLocationLabel("");
  }, [open, defaultDate]);

  // When participant is selected, prefill location from their address if empty.
  useEffect(() => {
    if (locationKind !== "PARTICIPANT" || !customerId) return;
    const p = participants.find((row) => row.id === customerId);
    if (p?.address && !locationLabel) {
      setLocationLabel(p.address);
    }
  }, [customerId, locationKind, participants, locationLabel]);

  if (!open) return null;

  function buildBody(): CreateScheduleShiftRequest | null {
    if (durationMinutes < 5 || durationMinutes % 5 !== 0) {
      setError("Duration must be at least 5 minutes, in 5-minute steps.");
      return null;
    }
    if (!serviceTitle.trim()) {
      setError("Enter a service title.");
      return null;
    }
    if (locationKind === "PARTICIPANT" && !customerId) {
      setError("Select a participant.");
      return null;
    }
    if (!locationLabel.trim()) {
      setError("Enter a location.");
      return null;
    }
    if (recurring && !untilDate) {
      setError("Choose an until date for the recurring series.");
      return null;
    }

    return {
      locationKind,
      customerId: locationKind === "PARTICIPANT" ? customerId : undefined,
      locationLabel: locationLabel.trim(),
      serviceLine,
      serviceTitle: serviceTitle.trim(),
      date,
      startTime,
      durationMinutes,
      notes: notes.trim() || undefined,
      recurring,
      frequency: recurring ? frequency : undefined,
      interval: recurring ? interval : undefined,
      untilDate: recurring ? untilDate : undefined,
    };
  }

  async function handlePreview() {
    setError("");
    setPreviewResult(null);
    const body = buildBody();
    if (!body || !body.recurring) return;
    try {
      const result = await preview(body).unwrap();
      setPreviewResult(result);
    } catch (err) {
      setError(getErrorMessage(err, "Could not preview recurrence"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const body = buildBody();
    if (!body) return;

    try {
      const result = await create(body).unwrap();
      onCreated(result.shifts.length);
      toast({
        variant: "success",
        title: result.shifts.length > 1 ? "Shift series created" : "Shift created",
        description: `${result.shifts.length} draft shift${result.shifts.length === 1 ? "" : "s"} saved. Assign or broadcast from Matching.`,
      });
      onClose();
    } catch (err) {
      const message = getErrorMessage(err, "Could not create shift");
      setError(message);
      toast({ variant: "error", title: "Could not create shift", description: message });
    }
  }

  const busy = createState.isLoading || previewState.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[min(90vh,760px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-labelledby="create-shift-title"
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-border/50 bg-surface px-5 py-4">
          <div>
            <h2 id="create-shift-title" className="text-lg font-semibold">
              Create shift
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Save as draft, then assign or broadcast from Matching.
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
          {/* Location type */}
          <div>
            <p className="input-label">Location type</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["PARTICIPANT", "Participant"],
                  ["SITE", "Site / facility"],
                  ["OTHER", "Other location"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setLocationKind(value);
                    setCustomerId("");
                    setLocationLabel("");
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    locationKind === value
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {locationKind === "PARTICIPANT" ? (
            <div>
              <label className="input-label" htmlFor="participant">
                Participant
              </label>
              <select
                id="participant"
                className="input-field"
                value={customerId}
                disabled={loadingParticipants}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select participant…</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="input-label" htmlFor="location">
              {locationKind === "SITE"
                ? "Site / facility"
                : locationKind === "OTHER"
                  ? "Other location"
                  : "Location / address"}
            </label>
            <input
              id="location"
              className="input-field"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder={
                locationKind === "SITE" ? "e.g. Riverside Supported Living" : "Address or place"
              }
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="service-line">
              Service line
            </label>
            <select
              id="service-line"
              className="input-field"
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value)}
            >
              {SERVICE_LINE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label" htmlFor="service-title">
              Service / title
            </label>
            <input
              id="service-title"
              className="input-field"
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="e.g. Morning personal care"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="input-label" htmlFor="shift-date">
                Date
              </label>
              <input
                id="shift-date"
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="start-time">
                Start time
              </label>
              <input
                id="start-time"
                type="time"
                step={300}
                className="input-field"
                value={startTime}
                onChange={(e) => setStartTimeKeepingDuration(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration ↔ end time stay in sync either way. */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="input-label" htmlFor="hours">
                Hours
              </label>
              <input
                id="hours"
                type="number"
                min={0}
                max={23}
                className="input-field"
                value={hours}
                onChange={(e) => setDurationFromParts(Number(e.target.value), minutes)}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="mins">
                Minutes
              </label>
              <select
                id="mins"
                className="input-field"
                value={minutes}
                onChange={(e) => setDurationFromParts(hours, Number(e.target.value))}
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label" htmlFor="end-time">
                End time
              </label>
              <input
                id="end-time"
                type="time"
                step={300}
                className="input-field"
                value={endTime}
                onChange={(e) => setEndTimeAndDuration(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              className="input-field min-h-[72px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => {
                setRecurring(e.target.checked);
                setPreviewResult(null);
              }}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <span>
              <span className="block text-sm font-semibold">Recurring shift</span>
              <span className="text-xs text-muted">
                Create linked drafts for a weekly or monthly pattern
              </span>
            </span>
          </label>

          {recurring ? (
            <div className="space-y-3 rounded-xl border border-border/60 bg-surface-subtle p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="input-label" htmlFor="freq">
                    Frequency
                  </label>
                  <select
                    id="freq"
                    className="input-field"
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(e.target.value as RecurrenceFrequency)
                    }
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="input-label" htmlFor="interval">
                    Every
                  </label>
                  <select
                    id="interval"
                    className="input-field"
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} {frequency === "WEEKLY" ? "week(s)" : "month(s)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label" htmlFor="until">
                  Until date
                </label>
                <input
                  id="until"
                  type="date"
                  className="input-field"
                  value={untilDate}
                  min={date}
                  onChange={(e) => {
                    setUntilDate(e.target.value);
                    setPreviewResult(null);
                  }}
                  required={recurring}
                />
              </div>
              <button
                type="button"
                className="btn-secondary !rounded-lg"
                disabled={busy}
                onClick={() => void handlePreview()}
              >
                {previewState.isLoading ? "Previewing…" : "Preview dates"}
              </button>
              {previewResult ? (
                <p className="text-sm text-muted">
                  Will create <strong>{previewResult.count}</strong> draft shift
                  {previewResult.count === 1 ? "" : "s"}
                  {previewResult.dates.length > 0
                    ? ` (${previewResult.dates[0]} → ${previewResult.dates[previewResult.dates.length - 1]})`
                    : ""}
                  .
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary !rounded-lg" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {createState.isLoading
                ? "Saving…"
                : recurring
                  ? "Create series"
                  : "Create draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEMO_PARTICIPANTS,
  DEMO_SERVICE_LINES,
  DEMO_SITES,
  endTimeFromDuration,
} from "@/lib/rostering/mock-data";
import { createShift } from "@/lib/rostering/store";
import type { LocationKind } from "@/lib/rostering/types";

type Props = {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onCreated: (shiftId: string) => void;
};

export function CreateShiftModal({ open, defaultDate, onClose, onCreated }: Props) {
  const [locationKind, setLocationKind] = useState<LocationKind>("PARTICIPANT");
  const [participantName, setParticipantName] = useState(DEMO_PARTICIPANTS[0]);
  const [locationLabel, setLocationLabel] = useState(DEMO_SITES[0]);
  const [otherLocation, setOtherLocation] = useState("");
  const [serviceLine, setServiceLine] = useState(DEMO_SERVICE_LINES[0]);
  const [serviceTitle, setServiceTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState(4);
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDate(defaultDate);
      setError("");
    }
  }, [open, defaultDate]);

  const endTime = useMemo(
    () => endTimeFromDuration(startTime, durationHours),
    [startTime, durationHours],
  );

  if (!open) return null;

  function resolvedLocation() {
    if (locationKind === "OTHER") return otherLocation.trim();
    if (locationKind === "SITE") return locationLabel;
    return locationLabel;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const location = resolvedLocation();
    if (!participantName.trim()) {
      setError("Select a participant.");
      return;
    }
    if (!location) {
      setError("Enter a location.");
      return;
    }
    if (!serviceTitle.trim()) {
      setError("Enter a service title.");
      return;
    }
    if (durationHours <= 0) {
      setError("Duration must be greater than zero.");
      return;
    }

    const shift = createShift({
      locationKind,
      participantName: participantName.trim(),
      locationLabel: location,
      serviceLine,
      serviceTitle: serviceTitle.trim(),
      date,
      startTime,
      durationHours,
      recurring,
    });

    onCreated(shift.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-labelledby="create-shift-title"
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-border/50 bg-surface px-5 py-4">
          <div>
            <h2 id="create-shift-title" className="text-lg font-semibold">
              Create shift
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              No worker is assigned here — use Matching to offer the shift.
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
                  onClick={() => setLocationKind(value)}
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

          <div>
            <label className="input-label" htmlFor="participant">
              Participant
            </label>
            <select
              id="participant"
              className="input-field"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
            >
              {DEMO_PARTICIPANTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {locationKind === "OTHER" ? (
            <div>
              <label className="input-label" htmlFor="other-loc">
                Other location
              </label>
              <input
                id="other-loc"
                className="input-field"
                value={otherLocation}
                onChange={(e) => setOtherLocation(e.target.value)}
                placeholder="Address or place name"
              />
            </div>
          ) : (
            <div>
              <label className="input-label" htmlFor="site">
                {locationKind === "SITE" ? "Site / facility" : "Related site"}
              </label>
              <select
                id="site"
                className="input-field"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
              >
                {DEMO_SITES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {DEMO_SERVICE_LINES.map((s) => (
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
              />
            </div>
            <div>
              <label className="input-label" htmlFor="start-time">
                Start time
              </label>
              <input
                id="start-time"
                type="time"
                className="input-field"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="input-label" htmlFor="duration">
                Duration (hours)
              </label>
              <input
                id="duration"
                type="number"
                min={0.5}
                step={0.5}
                className="input-field"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
              />
            </div>
            <div>
              <p className="input-label">End time</p>
              <p className="rounded-lg border border-border/60 bg-[#f8fafc] px-3.5 py-2.5 text-sm font-medium">
                {endTime}
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <span>
              <span className="block text-sm font-semibold">Recurring shift</span>
              <span className="text-xs text-muted">
                Optional — demo flag only; pattern setup comes later
              </span>
            </span>
          </label>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary !rounded-lg" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type DayKey = (typeof DAYS)[number];

type DayAvail = {
  enabled: boolean;
  start: string;
  end: string;
};

const DEFAULT_WEEK: Record<DayKey, DayAvail> = {
  Mon: { enabled: true, start: "07:00", end: "19:00" },
  Tue: { enabled: true, start: "07:00", end: "19:00" },
  Wed: { enabled: true, start: "07:00", end: "15:00" },
  Thu: { enabled: true, start: "07:00", end: "19:00" },
  Fri: { enabled: true, start: "07:00", end: "19:00" },
  Sat: { enabled: false, start: "09:00", end: "17:00" },
  Sun: { enabled: false, start: "09:00", end: "17:00" },
};

type Exception = { id: string; from: string; to: string; reason: string };

export function EmployeeAvailabilityContent() {
  const [week, setWeek] = useState(DEFAULT_WEEK);
  const [exceptions, setExceptions] = useState<Exception[]>([
    {
      id: "e1",
      from: "2026-09-20",
      to: "2026-09-21",
      reason: "Family commitment",
    },
  ]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  function toggleDay(day: DayKey) {
    setWeek((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  }

  function updateDay(day: DayKey, key: "start" | "end", value: string) {
    setWeek((prev) => ({
      ...prev,
      [day]: { ...prev[day], [key]: value },
    }));
  }

  function addException() {
    if (!from || !to) return;
    setExceptions((prev) => [
      ...prev,
      {
        id: `e${Date.now()}`,
        from,
        to,
        reason: reason || "Unavailable",
      },
    ]);
    setFrom("");
    setTo("");
    setReason("");
  }

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Availability"
        description="Rostering uses this when matching you to shifts."
        action={
          <button type="button" className="btn-primary" onClick={save}>
            Save
          </button>
        }
      />

      {saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Availability saved (UI only — not persisted yet).
        </div>
      ) : null}

      <section className="dashboard-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Weekly pattern</h2>
          <p className="mt-0.5 text-sm text-muted">Days and times you are usually available</p>
        </div>
        <ul className="divide-y divide-border/40">
          {DAYS.map((day) => {
            const row = week[day];
            return (
              <li
                key={day}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={() => toggleDay(day)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="w-10 text-sm font-semibold">{day}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    className="input-field !w-auto"
                    disabled={!row.enabled}
                    value={row.start}
                    onChange={(e) => updateDay(day, "start", e.target.value)}
                  />
                  <span className="text-xs text-muted">to</span>
                  <input
                    type="time"
                    className="input-field !w-auto"
                    disabled={!row.enabled}
                    value={row.end}
                    onChange={(e) => updateDay(day, "end", e.target.value)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="dashboard-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Unavailable dates</h2>
          <p className="mt-0.5 text-sm text-muted">One-off exceptions to your weekly pattern</p>
        </div>

        <ul className="divide-y divide-border/40">
          {exceptions.map((ex) => (
            <li
              key={ex.id}
              className="flex items-start justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="text-sm font-semibold">
                  {ex.from} → {ex.to}
                </p>
                <p className="mt-0.5 text-xs text-muted">{ex.reason}</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-red-600 hover:underline"
                onClick={() =>
                  setExceptions((prev) => prev.filter((e) => e.id !== ex.id))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="space-y-3 border-t border-border/50 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="input-label">From</label>
              <input
                type="date"
                className="input-field"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">To</label>
              <input
                type="date"
                className="input-field"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="input-label">Reason</label>
            <input
              className="input-field"
              placeholder="Optional"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-secondary !rounded-lg"
            onClick={addException}
          >
            Add unavailable period
          </button>
        </div>
      </section>
    </div>
  );
}

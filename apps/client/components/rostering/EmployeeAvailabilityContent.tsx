"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useGetMyAvailabilityQuery,
  useSaveMyAvailabilityMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { AvailabilityException, DayAvailability } from "@/lib/api/types";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Employee weekly availability + dated exceptions.
 * Matching uses this for FULL / PARTIAL / UNAVAILABLE (OX-029).
 */
export function EmployeeAvailabilityContent() {
  const { data, isLoading, error } = useGetMyAvailabilityQuery();
  const [save, saveState] = useSaveMyAvailabilityMutation();

  const [weekly, setWeekly] = useState<DayAvailability[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!data) return;
    setWeekly(data.weekly.map((d) => ({ ...d })));
    setExceptions(data.exceptions.map((e) => ({ ...e })));
  }, [data]);

  function toggleDay(dayOfWeek: number) {
    setWeekly((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, enabled: !d.enabled } : d,
      ),
    );
  }

  function updateDay(dayOfWeek: number, key: "startTime" | "endTime", value: string) {
    setWeekly((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [key]: value } : d)),
    );
  }

  function addException() {
    if (!from || !to) return;
    setExceptions((prev) => [
      ...prev,
      { fromDate: from, toDate: to, reason: reason || "Unavailable" },
    ]);
    setFrom("");
    setTo("");
    setReason("");
  }

  async function handleSave() {
    setLocalError("");
    setMessage("");
    try {
      await save({
        weekly,
        exceptions: exceptions.map((e) => ({
          fromDate: e.fromDate,
          toDate: e.toDate,
          reason: e.reason,
        })),
      }).unwrap();
      setMessage("Availability saved.");
      window.setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setLocalError(getErrorMessage(err, "Could not save availability"));
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading availability…</p>;
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load availability.")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Availability"
        description="Rostering uses this when matching you to shifts."
        action={
          <button
            type="button"
            className="btn-primary"
            disabled={saveState.isLoading}
            onClick={() => void handleSave()}
          >
            {saveState.isLoading ? "Saving…" : "Save"}
          </button>
        }
      />

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      ) : null}
      {localError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {localError}
        </div>
      ) : null}

      <section className="dashboard-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Weekly pattern</h2>
          <p className="mt-0.5 text-sm text-muted">
            Days and times you are usually available
          </p>
        </div>
        <ul className="divide-y divide-border/40">
          {weekly.map((row) => (
            <li
              key={row.dayOfWeek}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={() => toggleDay(row.dayOfWeek)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="w-10 text-sm font-semibold">
                  {DAY_LABELS[row.dayOfWeek - 1]}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  step={300}
                  className="input-field !w-auto"
                  disabled={!row.enabled}
                  value={row.startTime}
                  onChange={(e) => updateDay(row.dayOfWeek, "startTime", e.target.value)}
                />
                <span className="text-xs text-muted">to</span>
                <input
                  type="time"
                  step={300}
                  className="input-field !w-auto"
                  disabled={!row.enabled}
                  value={row.endTime}
                  onChange={(e) => updateDay(row.dayOfWeek, "endTime", e.target.value)}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold">Unavailable dates</h2>
          <p className="mt-0.5 text-sm text-muted">
            One-off exceptions to your weekly pattern
          </p>
        </div>

        <ul className="divide-y divide-border/40">
          {exceptions.length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted">No exceptions yet.</li>
          ) : (
            exceptions.map((ex, index) => (
              <li
                key={`${ex.fromDate}-${ex.toDate}-${index}`}
                className="flex items-start justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {ex.fromDate} → {ex.toDate}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{ex.reason || "Unavailable"}</p>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-red-600 hover:underline"
                  onClick={() =>
                    setExceptions((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </button>
              </li>
            ))
          )}
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

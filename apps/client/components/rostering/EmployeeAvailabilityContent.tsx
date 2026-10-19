"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ConstrainedDateInput } from "@/components/ui/ConstrainedDateInput";
import { ConstrainedTimeInput } from "@/components/ui/ConstrainedTimeInput";
import {
  useGetMyAvailabilityQuery,
  useSaveMyAvailabilityMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import type { AvailabilityException, DayAvailability } from "@/lib/api/types";
import { formatLongDate } from "@/lib/rostering/format";

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/**
 * Employee weekly availability + dated exceptions.
 * Matching uses this for FULL / PARTIAL / UNAVAILABLE (OX-029).
 */
export function EmployeeAvailabilityContent() {
  const { toast } = useToast();
  const { data, isLoading, error } = useGetMyAvailabilityQuery();
  const [save, saveState] = useSaveMyAvailabilityMutation();

  const [weekly, setWeekly] = useState<DayAvailability[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data) return;
    setWeekly(data.weekly.map((d) => ({ ...d })));
    setExceptions(data.exceptions.map((e) => ({ ...e })));
    setDirty(false);
  }, [data]);

  const enabledDays = useMemo(
    () => weekly.filter((d) => d.enabled).length,
    [weekly],
  );

  function markDirty() {
    setDirty(true);
  }

  function toggleDay(dayOfWeek: number) {
    setWeekly((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, enabled: !d.enabled } : d,
      ),
    );
    markDirty();
  }

  function updateDay(dayOfWeek: number, key: "startTime" | "endTime", value: string) {
    setWeekly((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [key]: value } : d)),
    );
    markDirty();
  }

  function addException() {
    if (!from || !to) {
      setLocalError("Choose a from and to date for the unavailable period.");
      return;
    }
    if (to < from) {
      setLocalError("The end date must be on or after the start date.");
      return;
    }
    setLocalError("");
    setExceptions((prev) => [
      ...prev,
      { fromDate: from, toDate: to, reason: reason || "Unavailable" },
    ]);
    setFrom("");
    setTo("");
    setReason("");
    markDirty();
  }

  async function handleSave() {
    setLocalError("");
    try {
      await save({
        weekly,
        exceptions: exceptions.map((e) => ({
          fromDate: e.fromDate,
          toDate: e.toDate,
          reason: e.reason,
        })),
      }).unwrap();
      setDirty(false);
      toast({
        variant: "success",
        title: "Availability saved",
        description: "Your rostering team will use this when matching shifts.",
      });
    } catch (err) {
      setLocalError(getErrorMessage(err, "Could not save availability"));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Availability" description="Loading your pattern…" />
        <div className="dashboard-card h-40 animate-pulse" />
        <div className="dashboard-card h-64 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Availability" />
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getErrorMessage(error, "Could not load availability.")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Availability"
        description="Tell your rostering team when you can work. Matching uses this pattern."
        action={
          <button
            type="button"
            className="btn-primary disabled:opacity-50"
            disabled={saveState.isLoading || !dirty}
            onClick={() => void handleSave()}
          >
            {saveState.isLoading ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        }
      />

      {localError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {localError}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Days available" value={`${enabledDays} of 7`} />
        <Stat label="Exceptions" value={String(exceptions.length)} />
        <Stat
          label="Status"
          value={dirty ? "Unsaved changes" : "Up to date"}
          tone={dirty ? "warn" : "ok"}
        />
      </div>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Weekly pattern</h2>
          <p className="mt-0.5 text-sm text-muted">
            Toggle days on and set the hours you are usually free
          </p>
        </div>
        <ul className="divide-y divide-border/40">
          {weekly.map((row) => (
            <li
              key={row.dayOfWeek}
              className={`flex flex-col gap-3 px-5 py-4 transition sm:flex-row sm:items-center sm:justify-between ${
                row.enabled ? "" : "bg-surface-subtle/60"
              }`}
            >
              <label className="flex cursor-pointer items-center gap-3">
                <span
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    row.enabled ? "bg-primary" : "bg-surface-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={row.enabled}
                    onChange={() => toggleDay(row.dayOfWeek)}
                  />
                  <span
                    className={`absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      row.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
                <span
                  className={`text-sm font-semibold ${
                    row.enabled ? "text-foreground" : "text-muted"
                  }`}
                >
                  {DAY_LABELS[row.dayOfWeek - 1]}
                </span>
              </label>

              {row.enabled ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <ConstrainedTimeInput
                    aria-label={`${DAY_LABELS[row.dayOfWeek - 1]} start time`}
                    className="min-w-0 flex-1"
                    value={row.startTime}
                    onChange={(next) =>
                      updateDay(row.dayOfWeek, "startTime", next)
                    }
                  />
                  <span className="shrink-0 text-xs text-muted">to</span>
                  <ConstrainedTimeInput
                    aria-label={`${DAY_LABELS[row.dayOfWeek - 1]} end time`}
                    className="min-w-0 flex-1"
                    value={row.endTime}
                    onChange={(next) =>
                      updateDay(row.dayOfWeek, "endTime", next)
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-muted">Unavailable</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Time off & exceptions</h2>
          <p className="mt-0.5 text-sm text-muted">
            Block out leave, medical appointments, or other unavailable periods
          </p>
        </div>

        {exceptions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No exceptions yet. Add any dates you will not be available.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {exceptions.map((ex, index) => (
              <li
                key={`${ex.fromDate}-${ex.toDate}-${index}`}
                className="flex items-start justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {ex.fromDate === ex.toDate
                      ? formatLongDate(ex.fromDate)
                      : `${formatLongDate(ex.fromDate)} → ${formatLongDate(ex.toDate)}`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {ex.reason || "Unavailable"}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-red-600 hover:underline"
                  onClick={() => {
                    setExceptions((prev) => prev.filter((_, i) => i !== index));
                    markDirty();
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 border-t border-border/50 bg-surface-subtle/40 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Add unavailable period
          </p>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="input-label" htmlFor="avail-from">
                From
              </label>
              <ConstrainedDateInput
                id="avail-from"
                aria-label="Unavailable from"
                value={from}
                onChange={setFrom}
              />
            </div>
            <div className="min-w-0">
              <label className="input-label" htmlFor="avail-to">
                To
              </label>
              <ConstrainedDateInput
                id="avail-to"
                aria-label="Unavailable to"
                value={to}
                min={from || undefined}
                onChange={setTo}
              />
            </div>
          </div>
          <div>
            <label className="input-label" htmlFor="avail-reason">
              Reason <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="avail-reason"
              className="input-field"
              placeholder="e.g. Annual leave, medical appointment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-secondary !rounded-lg"
            onClick={addException}
          >
            Add period
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="dashboard-card px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-1 text-lg font-bold tracking-tight ${
          tone === "warn"
            ? "text-amber-800"
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

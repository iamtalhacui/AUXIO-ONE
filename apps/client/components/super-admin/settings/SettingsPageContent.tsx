"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConstrainedDateTimeInput } from "@/components/ui/ConstrainedDateTimeInput";
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";

function toDatetimeLocalValue(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatWindow(startsAt: string | null, endsAt: string | null) {
  if (!startsAt) return null;
  const start = new Date(startsAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  if (!endsAt) return `${start} (open-ended)`;
  const end = new Date(endsAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `${start} → ${end}`;
}

export function SettingsPageContent() {
  const { toast } = useToast();
  const { data, isLoading, error } = useGetPlatformSettingsQuery(undefined, {
    pollingInterval: 30_000,
  });
  const [updateSettings, { isLoading: isSaving }] = useUpdatePlatformSettingsMutation();

  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!data) return;
    setStartsLocal(toDatetimeLocalValue(data.startsAt));
    setEndsLocal(toDatetimeLocalValue(data.endsAt));
    setMessage(data.message ?? "");
  }, [data]);

  const windowLabel = useMemo(
    () => (data ? formatWindow(data.startsAt, data.endsAt) : null),
    [data],
  );

  async function runAction(
    action: "schedule" | "emergency" | "clear",
    opts?: { startsAt?: string; endsAt?: string | null; message?: string | null },
  ) {
    try {
      const saved = await updateSettings({
        action,
        startsAt: opts?.startsAt,
        endsAt: opts?.endsAt,
        message: opts?.message,
      }).unwrap();

      const titles = {
        schedule:
          saved.status === "active"
            ? "Maintenance is active"
            : "Maintenance scheduled",
        emergency: "Emergency maintenance is on",
        clear: "Maintenance cleared",
      } as const;

      toast({
        variant: action === "clear" ? "success" : "warning",
        title: titles[action],
        description:
          action === "clear"
            ? "Organisation logins are allowed again."
            : formatWindow(saved.startsAt, saved.endsAt) ??
              "Organisation users will see this notice.",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not update maintenance",
        description: getErrorMessage(err, "Could not update maintenance settings."),
      });
    }
  }

  async function handleSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startsAt = fromDatetimeLocalValue(startsLocal);
    if (!startsAt) {
      toast({
        variant: "error",
        title: "Start time required",
        description: "Pick when maintenance should begin.",
      });
      return;
    }
    const endsAt = fromDatetimeLocalValue(endsLocal);
    await runAction("schedule", {
      startsAt,
      endsAt,
      message: message.trim() || null,
    });
  }

  async function handleEmergency() {
    const endsAt = fromDatetimeLocalValue(endsLocal);
    await runAction("emergency", {
      endsAt,
      message: message.trim() || null,
    });
  }

  async function handleClear() {
    await runAction("clear");
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load platform settings.")}
      </p>
    );
  }

  const statusTone =
    data.status === "active"
      ? "border-red-200 bg-red-50 text-red-900"
      : data.status === "scheduled"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-border bg-surface-muted text-foreground";

  const statusLabel =
    data.status === "active"
      ? "Active — organisation access is blocked"
      : data.status === "scheduled"
        ? "Scheduled — organisations see an advance notice"
        : "Off — no maintenance window";

  return (
    <div className="space-y-6">
      <section className="dashboard-card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Maintenance</h2>
          <p className="mt-1 text-sm text-muted">
            Schedule a window so organisations see the timing in advance, or turn on
            emergency lock immediately. Super Admin stays available either way.
          </p>
        </div>

        <div className={`rounded-xl border px-4 py-3 text-sm ${statusTone}`}>
          <p className="font-semibold">{statusLabel}</p>
          {windowLabel ? <p className="mt-1 text-sm opacity-90">{windowLabel}</p> : null}
          {data.message ? (
            <p className="mt-2 text-sm opacity-90">Message: {data.message}</p>
          ) : null}
        </div>
      </section>

      <form className="dashboard-card space-y-5 p-6" onSubmit={handleSchedule}>
        <div>
          <h3 className="text-base font-semibold">Schedule window</h3>
          <p className="mt-1 text-sm text-muted">
            Organisations and team members see a banner with these times before lock
            starts.
          </p>
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <span className="input-label">Starts</span>
            <ConstrainedDateTimeInput
              id="maintenance-starts"
              aria-label="Maintenance starts"
              value={startsLocal}
              onChange={setStartsLocal}
            />
          </div>
          <div className="min-w-0">
            <span className="input-label">Ends (optional)</span>
            <ConstrainedDateTimeInput
              id="maintenance-ends"
              aria-label="Maintenance ends"
              value={endsLocal}
              onChange={setEndsLocal}
            />
            <span className="mt-1 block text-xs text-muted">
              Leave empty for open-ended until you clear it.
            </span>
          </div>
        </div>

        <label className="block">
          <span className="input-label">Notice message (optional)</span>
          <textarea
            className="input-field min-h-[88px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            placeholder="e.g. Platform maintenance Friday 10:00–12:00. Rostering will be unavailable during this window."
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-70"
          >
            {isSaving ? "Saving…" : "Save schedule"}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleEmergency}
            className="rounded-md border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-70"
          >
            Emergency: enable now
          </button>
          <button
            type="button"
            disabled={isSaving || data.status === "off"}
            onClick={handleClear}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-muted disabled:opacity-50"
          >
            Clear maintenance
          </button>
        </div>
      </form>
    </div>
  );
}

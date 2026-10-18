"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ConstrainedSelect } from "@/components/ui/ConstrainedSelect";
import {
  useListServiceLineTasksQuery,
  useSaveServiceLineTasksMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

/**
 * Org Admin edits the required-task checklist for each service line.
 * New shifts copy this catalogue at create time.
 */
export function ServiceLineTasksContent() {
  const { data = [], isLoading, error } = useListServiceLineTasksQuery();
  const [save, saveState] = useSaveServiceLineTasksMutation();
  const [selectedLine, setSelectedLine] = useState("");
  const [labelsText, setLabelsText] = useState("");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!data.length) return;
    if (!selectedLine) {
      setSelectedLine(data[0].serviceLine);
      setLabelsText(data[0].labels.join("\n"));
      return;
    }
    const row = data.find((d) => d.serviceLine === selectedLine);
    if (row) setLabelsText(row.labels.join("\n"));
  }, [data, selectedLine]);

  const lineOptions = useMemo(
    () =>
      data.map((row) => ({
        value: row.serviceLine,
        label: row.serviceLine,
      })),
    [data],
  );

  async function handleSave() {
    setLocalError("");
    setMessage("");
    const labels = labelsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!selectedLine || labels.length === 0) {
      setLocalError("Add at least one task on its own line.");
      return;
    }
    try {
      await save({ serviceLine: selectedLine, labels }).unwrap();
      setMessage("Task catalogue saved. New shifts will use this list.");
    } catch (err) {
      setLocalError(getErrorMessage(err, "Could not save catalogue"));
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading catalogues…</p>;
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load task catalogues.")}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4">
      <PageHeader
        title="Service line tasks"
        description="Required checklist copied onto shifts for each service line (v1)."
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

      <div className="dashboard-card min-w-0 space-y-4 overflow-visible p-4 sm:p-5">
        <div className="min-w-0">
          <label className="input-label" htmlFor="service-line">
            Service line
          </label>
          <ConstrainedSelect
            id="service-line"
            aria-label="Service line"
            value={selectedLine}
            options={lineOptions}
            onChange={setSelectedLine}
          />
        </div>
        <div className="min-w-0">
          <label className="input-label" htmlFor="labels">
            Required tasks (one per line)
          </label>
          <textarea
            id="labels"
            className="input-field min-h-[200px] max-w-full font-mono text-sm"
            value={labelsText}
            onChange={(e) => setLabelsText(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          disabled={saveState.isLoading}
          onClick={() => void handleSave()}
        >
          {saveState.isLoading ? "Saving…" : "Save catalogue"}
        </button>
      </div>
    </div>
  );
}

"use client";

type Props = {
  value: string;
  editable: boolean;
  dirty: boolean;
  saving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onReportIncident: () => void;
};

export function ShiftNotesPanel({
  value,
  editable,
  dirty,
  saving,
  onChange,
  onSave,
  onReportIncident,
}: Props) {
  if (!editable) {
    return (
      <section className="dashboard-card px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Progress note</h2>
        <p className="mt-0.5 text-sm text-muted">
          {value
            ? "Recorded during this shift."
            : "No progress note was recorded for this shift."}
        </p>
        {value ? (
          <p className="mt-3 whitespace-pre-wrap rounded-lg border border-border/60 bg-surface-subtle px-3.5 py-3 text-sm text-foreground">
            {value}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="dashboard-card px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Progress note</h2>
          <p className="mt-0.5 text-sm text-muted">
            Record what happened during this shift.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary !px-3.5 !py-2 text-xs"
          onClick={onReportIncident}
          disabled={saving}
        >
          Report incident
        </button>
      </div>

      <textarea
        className="input-field mt-3 min-h-[140px]"
        value={value}
        disabled={saving}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (dirty && !saving) onSave();
        }}
        placeholder="Supports provided, how the participant responded, anything the next worker should know…"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {saving
            ? "Saving…"
            : dirty
              ? "Unsaved changes — saves when you click away."
              : value
                ? "Saved."
                : "Autosaves when you click away."}
        </p>
        <button
          type="button"
          className="btn-secondary !rounded-lg !px-3.5 !py-2 text-xs disabled:opacity-50"
          disabled={saving || !dirty}
          onClick={onSave}
        >
          Save note
        </button>
      </div>
    </section>
  );
}

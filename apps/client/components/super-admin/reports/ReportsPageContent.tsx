import { reports } from "@/lib/dashboard/content/super-admin";

export function ReportsPageContent() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <article key={report.id} className="dashboard-card p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{report.name}</h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {report.format}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-muted">{report.description}</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light"
              >
                Generate
              </button>
              <button
                type="button"
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-muted"
              >
                Schedule
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Recent exports</h2>
        <p className="mt-1 text-sm text-muted">No exports generated yet in this UI preview.</p>
        <div className="mt-6 rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-muted">
          Generated reports will appear here once connected to the backend.
        </div>
      </div>
    </div>
  );
}

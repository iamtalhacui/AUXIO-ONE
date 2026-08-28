import { auditLog } from "@/lib/dashboard/content/super-admin";
import { ActionBadge } from "@/components/dashboard/StatusBadge";

export function AuditLogPageContent() {
  return (
    <div className="space-y-6">
      <div className="dashboard-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Audit log</h2>
            <p className="text-sm text-muted">Immutable record of platform actions</p>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none"
            />
            <button
              type="button"
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-surface-muted"
            >
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Action</th>
                <th className="px-6 py-3 font-semibold">Entity</th>
                <th className="px-6 py-3 font-semibold">Details</th>
                <th className="px-6 py-3 font-semibold">Actor</th>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => (
                <tr key={entry.id} className="border-t border-border/60">
                  <td className="px-6 py-4">
                    <ActionBadge action={entry.action} />
                  </td>
                  <td className="px-6 py-4 font-medium">{entry.entityType}</td>
                  <td className="px-6 py-4 text-muted">{entry.entityLabel}</td>
                  <td className="px-6 py-4">{entry.actor}</td>
                  <td className="px-6 py-4 text-muted">{entry.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

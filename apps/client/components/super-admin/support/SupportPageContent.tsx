import { supportRequests } from "@/lib/dashboard/content/super-admin";

export function SupportPageContent() {
  return (
    <div className="space-y-6">
      <div className="dashboard-card border-primary/20 bg-primary/5 p-6">
        <h2 className="text-lg font-semibold text-primary">Break-glass support access</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Super Admin support access is time-limited, logged, and visible to the organisation.
          No operational data is accessed without an active, approved request.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
        >
          Request support access
        </button>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Access history</h2>
          <p className="text-sm text-muted">Past and active break-glass sessions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Organisation</th>
                <th className="px-6 py-3 font-semibold">Requested by</th>
                <th className="px-6 py-3 font-semibold">Reason</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Expires</th>
              </tr>
            </thead>
            <tbody>
              {supportRequests.map((req) => (
                <tr key={req.id} className="border-t border-border/60">
                  <td className="px-6 py-4 font-medium">{req.organisation}</td>
                  <td className="px-6 py-4">{req.requestedBy}</td>
                  <td className="px-6 py-4 text-muted">{req.reason}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        req.status === "ACTIVE"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-muted text-muted"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{req.expiresAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

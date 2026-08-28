import { entitlements } from "@/lib/dashboard/content/super-admin";

export function EntitlementsPageContent() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Total entitlements</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{entitlements.length}</p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Enabled</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {entitlements.filter((e) => e.enabled).length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Ceiling only</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {entitlements.filter((e) => !e.enabled).length}
          </p>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Module entitlements</h2>
          <p className="text-sm text-muted">Ceiling grants and enabled status per organisation</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Organisation</th>
                <th className="px-6 py-3 font-semibold">Module</th>
                <th className="px-6 py-3 font-semibold">Ceiling</th>
                <th className="px-6 py-3 font-semibold">Enabled</th>
                <th className="px-6 py-3 font-semibold">Granted</th>
              </tr>
            </thead>
            <tbody>
              {entitlements.map((row) => (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="px-6 py-4 font-medium">{row.organisation}</td>
                  <td className="px-6 py-4">
                    <p>{row.moduleName}</p>
                    <p className="text-xs text-muted">Code {row.moduleCode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      Granted
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-surface-muted text-muted"
                      }`}
                    >
                      {row.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{row.grantedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

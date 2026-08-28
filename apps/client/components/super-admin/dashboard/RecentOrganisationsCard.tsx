import Link from "next/link";
import { recentOrganisations } from "@/lib/dashboard/content/super-admin";

const statusStyles = {
  ACTIVE: "bg-primary/10 text-primary",
  SUSPENDED: "bg-accent/10 text-accent",
  CLOSED: "bg-surface-muted text-muted",
} as const;

export function RecentOrganisationsCard() {
  return (
    <div className="dashboard-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">Recent organisations</h2>
          <p className="text-sm text-muted">Latest tenants registered on the platform</p>
        </div>
        <Link href="/super-admin/organisations" className="text-sm font-semibold text-primary">
          View all
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-6 py-3 font-semibold">Organisation</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Modules</th>
              <th className="px-6 py-3 font-semibold">Registered</th>
            </tr>
          </thead>
          <tbody>
            {recentOrganisations.map((org) => (
              <tr key={org.id} className="border-t border-border/60">
                <td className="px-6 py-4">
                  <p className="font-medium">{org.tradingName}</p>
                  <p className="text-xs text-muted">{org.legalName}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[org.status]}`}
                  >
                    {org.status}
                  </span>
                </td>
                  <td className="px-6 py-4 text-muted">{org.modulesGranted} granted</td>
                <td className="px-6 py-4 text-muted">{org.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

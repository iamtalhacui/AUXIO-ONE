import { healthMetrics } from "@/lib/dashboard/content/super-admin";
import { HealthBadge } from "@/components/dashboard/StatusBadge";

export function HealthPageContent() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthMetrics.map((metric) => (
          <div key={metric.label} className="dashboard-card p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted">{metric.label}</p>
              <HealthBadge status={metric.status} />
            </div>
            <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Service status</h2>
          <ul className="mt-5 space-y-4">
            {["API Server", "PostgreSQL", "Email (stub)", "Background jobs"].map((service) => (
              <li key={service} className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
                <span className="text-sm font-medium">{service}</span>
                <HealthBadge status="healthy" />
              </li>
            ))}
          </ul>
        </div>

        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <div className="mt-5 space-y-4">
            {[
              { label: "Requests (24h)", value: "1,284" },
              { label: "Active sessions", value: "18" },
              { label: "Organisations online", value: "6" },
              { label: "Last deployment", value: "28 Aug 2026" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0">
                <span className="text-sm text-muted">{item.label}</span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

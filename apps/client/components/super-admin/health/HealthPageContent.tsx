"use client";

import { HealthBadge } from "@/components/dashboard/StatusBadge";

const data = {
  status: "healthy",
  services: {
    api: "healthy",
    database: "healthy",
    email: "configured",
  },
  checkedAt: new Date().toISOString(),
};

export function HealthPageContent() {
  const metrics = [
    { label: "Platform status", value: data.status, status: data.status },
    { label: "API", value: data.services.api, status: data.services.api },
    { label: "Database", value: data.services.database, status: data.services.database },
    {
      label: "Email",
      value: data.services.email,
      status: data.services.email === "configured" ? "healthy" : "degraded",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="dashboard-card p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted">{metric.label}</p>
              <HealthBadge
                status={
                  metric.status === "healthy" || metric.status === "configured"
                    ? "healthy"
                    : "warning"
                }
              />
            </div>
            <p className="mt-3 text-2xl font-semibold capitalize">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-card p-6 text-sm text-muted">
        Last checked {new Date(data.checkedAt).toLocaleString("en-AU")}
      </div>
    </div>
  );
}

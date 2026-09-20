"use client";

import { WelcomeBanner } from "@/components/super-admin/dashboard/WelcomeBanner";
import { OverviewStatCards } from "@/components/super-admin/dashboard/OverviewStatCards";
import { NeedsAttentionCard } from "@/components/super-admin/dashboard/NeedsAttentionCard";
import { OverviewCharts } from "@/components/super-admin/dashboard/OverviewCharts";
import { useGetPlatformOverviewQuery } from "@/lib/api/platformAuthApi";

// Super Admin home: ops-first overview from GET /platform/overview.
// Kept to 3 rows (welcome / KPIs+attention / charts) — no duplicated
// recent-organisations / recent-audit previews, those live one click
// away on their own pages.
export function OverviewDashboard() {
  const { data, isLoading, error } = useGetPlatformOverviewQuery();

  if (isLoading) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        Could not load the platform overview. Try refreshing the page.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner maintenanceMode={data.maintenanceMode} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr]">
        <OverviewStatCards
          kpis={data.kpis}
          registrationsLast30Days={data.registrationsLast30Days}
        />
        <NeedsAttentionCard attention={data.attention} />
      </div>

      <OverviewCharts
        planMix={data.kpis.planMix}
        organisationsTotal={data.kpis.organisationsTotal}
        organisationsActive={data.kpis.organisationsActive}
        organisationsSuspended={data.kpis.organisationsSuspended}
        demoPipeline={data.demoPipeline}
      />
    </div>
  );
}

"use client";

import { useGetRosterOverviewQuery } from "@/lib/api/authApi";
import { RosterWelcomeBanner } from "@/components/rostering/dashboard/RosterWelcomeBanner";
import { RosterStatCards } from "@/components/rostering/dashboard/RosterStatCards";
import { RosterNeedsAttentionCard } from "@/components/rostering/dashboard/RosterNeedsAttentionCard";
import { RosterCoverageCharts } from "@/components/rostering/dashboard/RosterCoverageCharts";

// Rostering Expert home: ops-first overview from GET /organisation/roster/overview.
// Layout A: welcome → KPIs + attention → charts.
export function RosterOverviewDashboard() {
  const { data, isLoading, error } = useGetRosterOverviewQuery();

  if (isLoading) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        Could not load your roster overview. Try refreshing the page.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <RosterWelcomeBanner organisation={data.organisation} today={data.today} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr]">
        <RosterStatCards
          kpis={data.kpis}
          shiftsCreatedLast14Days={data.shiftsCreatedLast14Days}
          scheduleEnabled={data.modules.scheduleEnabled}
        />
        <RosterNeedsAttentionCard
          attention={data.attention}
          scheduleEnabled={data.modules.scheduleEnabled}
        />
      </div>

      <RosterCoverageCharts
        coverageFunnelNext7Days={data.coverageFunnelNext7Days}
        todayStatusMix={data.todayStatusMix}
        weekLoad={data.weekLoad}
        scheduleEnabled={data.modules.scheduleEnabled}
      />
    </div>
  );
}

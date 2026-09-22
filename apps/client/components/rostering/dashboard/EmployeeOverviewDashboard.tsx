"use client";

import { useGetEmployeeOverviewQuery } from "@/lib/api/authApi";
import { EmployeeWelcomeBanner } from "@/components/rostering/dashboard/EmployeeWelcomeBanner";
import { EmployeeStatCards } from "@/components/rostering/dashboard/EmployeeStatCards";
import { EmployeeNeedsAttentionCard } from "@/components/rostering/dashboard/EmployeeNeedsAttentionCard";
import { EmployeeWorkCharts } from "@/components/rostering/dashboard/EmployeeWorkCharts";

// Employee home: ops-first overview from GET /organisation/employee/overview.
// Layout A: welcome → KPIs + attention (inline offer actions) → charts.
export function EmployeeOverviewDashboard() {
  const { data, isLoading, error } = useGetEmployeeOverviewQuery();

  if (isLoading) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        Could not load your employee overview. Try refreshing the page.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <EmployeeWelcomeBanner
        organisation={data.organisation}
        today={data.today}
        nextShift={data.attention.nextShift}
        serviceDeliveryEnabled={data.modules.serviceDeliveryEnabled}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr]">
        <EmployeeStatCards
          kpis={data.kpis}
          scheduleEnabled={data.modules.scheduleEnabled}
        />
        <EmployeeNeedsAttentionCard
          attention={data.attention}
          scheduleEnabled={data.modules.scheduleEnabled}
          serviceDeliveryEnabled={data.modules.serviceDeliveryEnabled}
        />
      </div>

      <EmployeeWorkCharts
        weekLoad={data.weekLoad}
        myStatusMix={data.myStatusMix}
        availabilityNext7Days={data.availabilityNext7Days}
        scheduleEnabled={data.modules.scheduleEnabled}
      />
    </div>
  );
}

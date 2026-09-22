"use client";

import { useGetManagerOverviewQuery } from "@/lib/api/authApi";
import { ManagerWelcomeBanner } from "@/components/manager/dashboard/ManagerWelcomeBanner";
import { CustomerStatCards } from "@/components/manager/dashboard/CustomerStatCards";
import { ManagerNeedsAttentionCard } from "@/components/manager/dashboard/ManagerNeedsAttentionCard";
import { CustomerCrmCharts } from "@/components/manager/dashboard/CustomerCrmCharts";

// Manager home: ops-first overview from GET /organisation/manager/overview.
// Layout: welcome → KPIs + attention → charts (option A). Soft-gates
// Customers/CRM sections when those modules are off.
export function ManagerOverviewDashboard() {
  const { data, isLoading, error } = useGetManagerOverviewQuery();

  if (isLoading) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        Could not load your manager overview. Try refreshing the page.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ManagerWelcomeBanner organisation={data.organisation} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr]">
        <CustomerStatCards
          kpis={data.kpis}
          customerJoinsLast14Days={data.customerJoinsLast14Days}
          modules={data.modules}
        />
        <ManagerNeedsAttentionCard attention={data.attention} modules={data.modules} />
      </div>

      <CustomerCrmCharts
        customerStatusMix={data.customerStatusMix}
        crmPipeline={data.crmPipeline}
        pipelineValueByStage={data.pipelineValueByStage}
        modules={data.modules}
      />
    </div>
  );
}

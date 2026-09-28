"use client";

import { useGetOrgAdminOverviewQuery } from "@/lib/api/authApi";
import { OrgAdminWelcomeBanner } from "@/components/org-admin/dashboard/OrgAdminWelcomeBanner";
import { TeamStatCards } from "@/components/org-admin/dashboard/TeamStatCards";
import { TeamNeedsAttentionCard } from "@/components/org-admin/dashboard/TeamNeedsAttentionCard";
import { WorkforceCharts } from "@/components/org-admin/dashboard/WorkforceCharts";

export function OrgAdminOverviewDashboard() {
  const { data, isLoading, error } = useGetOrgAdminOverviewQuery();

  if (isLoading) {
    return (
      <div className="oad-shell">
        <div className="oad-skeleton oad-hero" />
        <div className="oad-kpi-grid">
          <div className="oad-skeleton oad-kpi" />
          <div className="oad-skeleton oad-kpi" />
          <div className="oad-skeleton oad-kpi" />
          <div className="oad-skeleton oad-kpi" />
        </div>
        <div className="oad-skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="oad-card p-8 text-center">
        <p className="text-sm font-medium text-foreground">Couldn&apos;t load your dashboard</p>
        <p className="mt-1 text-sm text-muted">Refresh the page, or try again in a moment.</p>
      </div>
    );
  }

  return (
    <div className="oad-shell">
      <OrgAdminWelcomeBanner organisation={data.organisation} />
      <TeamStatCards kpis={data.kpis} teamJoinsLast14Days={data.teamJoinsLast14Days} />
      <TeamNeedsAttentionCard attention={data.attention} />
      <WorkforceCharts
        onboardingFunnel={data.onboardingFunnel}
        roleMix={data.roleMix}
        approvalLoad={data.approvalLoadLast30Days}
      />
    </div>
  );
}

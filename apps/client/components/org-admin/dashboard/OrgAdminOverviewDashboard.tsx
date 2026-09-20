"use client";

import { useGetOrgAdminOverviewQuery } from "@/lib/api/authApi";
import { OrgAdminWelcomeBanner } from "@/components/org-admin/dashboard/OrgAdminWelcomeBanner";
import { TeamStatCards } from "@/components/org-admin/dashboard/TeamStatCards";
import { TeamNeedsAttentionCard } from "@/components/org-admin/dashboard/TeamNeedsAttentionCard";
import { WorkforceCharts } from "@/components/org-admin/dashboard/WorkforceCharts";

// Org Admin home: ops-first overview from GET /organisation/overview,
// mirroring the Super Admin dashboard's shape (welcome / KPIs+attention /
// charts). No Customers/CRM data — Org Admin has no API access to those
// today — and no duplicated table previews; Team, Onboarding, and Shift
// approvals all already have dedicated pages one click away.
export function OrgAdminOverviewDashboard() {
  const { data, isLoading, error } = useGetOrgAdminOverviewQuery();

  if (isLoading) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        Could not load your organisation overview. Try refreshing the page.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <OrgAdminWelcomeBanner organisation={data.organisation} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr]">
        <TeamStatCards kpis={data.kpis} teamJoinsLast14Days={data.teamJoinsLast14Days} />
        <TeamNeedsAttentionCard attention={data.attention} />
      </div>

      <WorkforceCharts
        onboardingFunnel={data.onboardingFunnel}
        roleMix={data.roleMix}
        approvalLoad={data.approvalLoadLast30Days}
      />
    </div>
  );
}

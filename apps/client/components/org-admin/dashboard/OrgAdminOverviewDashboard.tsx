"use client";

import Link from "next/link";
import {
  useGetOrgAdminOverviewQuery,
  useGetOrgBillingSummaryQuery,
} from "@/lib/api/authApi";
import { OrgAdminWelcomeBanner } from "@/components/org-admin/dashboard/OrgAdminWelcomeBanner";
import { TeamStatCards } from "@/components/org-admin/dashboard/TeamStatCards";
import { TeamNeedsAttentionCard } from "@/components/org-admin/dashboard/TeamNeedsAttentionCard";
import { WorkforceCharts } from "@/components/org-admin/dashboard/WorkforceCharts";

export function OrgAdminOverviewDashboard() {
  const { data, isLoading, error } = useGetOrgAdminOverviewQuery();
  const { data: billing } = useGetOrgBillingSummaryQuery();

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

  const reminder = billing?.reminder;

  return (
    <div className="oad-shell">
      <OrgAdminWelcomeBanner organisation={data.organisation} />
      {reminder?.active && reminder.message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            reminder.kind === "SUSPENDED"
              ? "border-red-200 bg-red-50 text-red-800"
              : reminder.kind === "GRACE_PERIOD"
                ? "border-orange-200 bg-orange-50 text-orange-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p>{reminder.message}</p>
          <Link
            href="/org-admin/payments"
            className="mt-2 inline-flex font-semibold underline-offset-2 hover:underline"
          >
            Go to Payments
          </Link>
        </div>
      ) : null}
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

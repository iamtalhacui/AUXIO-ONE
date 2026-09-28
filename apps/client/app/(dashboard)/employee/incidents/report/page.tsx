"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EmployeeReportIncidentFlow } from "@/components/incidents/EmployeeReportIncidentFlow";
import { PageHeader } from "@/components/dashboard/PageHeader";

function ReportIncidentPageInner() {
  const searchParams = useSearchParams();
  const shiftId = searchParams.get("shiftId") ?? undefined;
  return <EmployeeReportIncidentFlow shiftId={shiftId} />;
}

export default function EmployeeReportIncidentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <PageHeader title="Report incident" description="Loading…" />
          <div className="dashboard-card h-64 animate-pulse" />
        </div>
      }
    >
      <ReportIncidentPageInner />
    </Suspense>
  );
}

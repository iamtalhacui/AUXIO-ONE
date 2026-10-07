"use client";

import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { RoleHomeContent } from "@/components/dashboard/RoleHomeContent";
import { getDashboardConfigForRole } from "@/lib/dashboard/config";
import { useAppSelector } from "@/lib/store/hooks";

export default function InsightsPage() {
  const role = useAppSelector((s) => s.orgAuth.user?.role);
  const roleLabel = getDashboardConfigForRole(role)?.roleLabel ?? "Insights";

  return (
    <PagePermissionGuard page="INSIGHTS">
      <RoleHomeContent roleLabel={roleLabel} />
    </PagePermissionGuard>
  );
}

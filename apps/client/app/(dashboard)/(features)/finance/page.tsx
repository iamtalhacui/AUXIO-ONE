import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { FeaturePagePlaceholder } from "@/components/dashboard/FeaturePagePlaceholder";

export default function FinancePage() {
  return (
    <PagePermissionGuard page="FINANCE">
      <FeaturePagePlaceholder
        title="Finance"
        description="Finance handoff and timesheet views for roles granted this page."
      />
    </PagePermissionGuard>
  );
}

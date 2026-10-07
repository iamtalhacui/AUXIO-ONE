import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { FeaturePagePlaceholder } from "@/components/dashboard/FeaturePagePlaceholder";

export default function ServiceDeliveryPage() {
  return (
    <PagePermissionGuard page="SERVICE_DELIVERY">
      <FeaturePagePlaceholder
        title="Service delivery"
        description="Service delivery tools for roles granted this page."
      />
    </PagePermissionGuard>
  );
}

import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { ManagerCrmContent } from "@/components/manager/ManagerCrmContent";

export default function CrmPage() {
  return (
    <PagePermissionGuard page="CRM">
      <ManagerCrmContent />
    </PagePermissionGuard>
  );
}

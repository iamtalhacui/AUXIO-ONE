import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { ManagerCustomersContent } from "@/components/manager/ManagerCustomersContent";

export default function CustomersPage() {
  return (
    <PagePermissionGuard page="CUSTOMERS">
      <ManagerCustomersContent />
    </PagePermissionGuard>
  );
}

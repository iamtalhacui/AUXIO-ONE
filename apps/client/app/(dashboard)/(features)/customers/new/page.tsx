import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { ManagerCreateCustomerForm } from "@/components/manager/ManagerCreateCustomerForm";

export default function NewCustomerPage() {
  return (
    <PagePermissionGuard page="CUSTOMERS">
      <ManagerCreateCustomerForm />
    </PagePermissionGuard>
  );
}

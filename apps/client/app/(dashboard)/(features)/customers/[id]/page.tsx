import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { ManagerCustomerDetailContent } from "@/components/manager/ManagerCustomerDetailContent";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PagePermissionGuard page="CUSTOMERS">
      <ManagerCustomerDetailContent customerId={id} />
    </PagePermissionGuard>
  );
}

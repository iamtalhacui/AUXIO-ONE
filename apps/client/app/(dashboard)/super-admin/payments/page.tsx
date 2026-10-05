import { PageHeader } from "@/components/dashboard/PageHeader";
import { SuperAdminPaymentsContent } from "@/components/super-admin/payments/SuperAdminPaymentsContent";

export default function SuperAdminPaymentsPage() {
  return (
    <>
      <PageHeader
        title="Payments"
        description="Review offline payment submissions and organisation subscription status."
      />
      <SuperAdminPaymentsContent />
    </>
  );
}

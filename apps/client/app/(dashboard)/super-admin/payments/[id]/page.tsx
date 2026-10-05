import { SuperAdminPaymentDetailContent } from "@/components/super-admin/payments/SuperAdminPaymentDetailContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SuperAdminPaymentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <SuperAdminPaymentDetailContent paymentId={id} />;
}

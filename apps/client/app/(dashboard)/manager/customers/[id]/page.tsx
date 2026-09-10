import { ManagerCustomerDetailContent } from "@/components/manager/ManagerCustomerDetailContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerCustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ManagerCustomerDetailContent customerId={id} />;
}

import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ customerId: string }>;
};

export default async function LegacyEmployeeParticipantPage({ params }: PageProps) {
  const { customerId } = await params;
  redirect(`/my-participants/${customerId}`);
}

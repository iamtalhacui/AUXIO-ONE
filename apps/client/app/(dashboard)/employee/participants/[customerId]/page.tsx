import { ParticipantCareViewContent } from "@/components/rostering/ParticipantCareViewContent";

type PageProps = {
  params: Promise<{ customerId: string }>;
};

export default async function EmployeeParticipantCarePage({ params }: PageProps) {
  const { customerId } = await params;
  return <ParticipantCareViewContent customerId={customerId} />;
}

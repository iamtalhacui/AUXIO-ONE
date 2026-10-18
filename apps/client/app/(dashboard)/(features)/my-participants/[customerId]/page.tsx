import { ParticipantCareViewContent } from "@/components/rostering/ParticipantCareViewContent";

type PageProps = {
  params: Promise<{ customerId: string }>;
};

export default async function MyParticipantCarePage({ params }: PageProps) {
  const { customerId } = await params;
  return <ParticipantCareViewContent customerId={customerId} />;
}

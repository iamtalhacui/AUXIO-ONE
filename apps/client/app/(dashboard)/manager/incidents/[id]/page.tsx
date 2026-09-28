import { ManagerIncidentDetailContent } from "@/components/incidents/ManagerIncidentDetailContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerIncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ManagerIncidentDetailContent incidentId={id} />;
}

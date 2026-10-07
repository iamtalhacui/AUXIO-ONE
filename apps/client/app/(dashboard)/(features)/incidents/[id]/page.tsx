import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { ManagerIncidentDetailContent } from "@/components/incidents/ManagerIncidentDetailContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PagePermissionGuard page="INCIDENTS">
      <ManagerIncidentDetailContent incidentId={id} />
    </PagePermissionGuard>
  );
}

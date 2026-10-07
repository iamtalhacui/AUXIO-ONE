import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { ManagerIncidentsContent } from "@/components/incidents/ManagerIncidentsContent";

export default function IncidentsPage() {
  return (
    <PagePermissionGuard page="INCIDENTS">
      <ManagerIncidentsContent />
    </PagePermissionGuard>
  );
}

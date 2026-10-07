import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { ScheduleBoardContent } from "@/components/rostering/ScheduleBoardContent";

export default function SchedulePage() {
  return (
    <PagePermissionGuard page="SCHEDULE">
      <ScheduleBoardContent />
    </PagePermissionGuard>
  );
}

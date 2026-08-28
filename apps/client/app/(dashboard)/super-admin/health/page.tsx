import { PageHeader } from "@/components/dashboard/PageHeader";
import { HealthPageContent } from "@/components/super-admin/health/HealthPageContent";

export default function HealthPage() {
  return (
    <>
      <PageHeader
        title="Usage & health"
        description="Platform service status and activity metrics."
      />
      <HealthPageContent />
    </>
  );
}

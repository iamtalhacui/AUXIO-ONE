import { PageHeader } from "@/components/dashboard/PageHeader";
import { ReportsPageContent } from "@/components/super-admin/reports/ReportsPageContent";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and export platform insights."
      />
      <ReportsPageContent />
    </>
  );
}

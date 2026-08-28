import { PageHeader } from "@/components/dashboard/PageHeader";
import { SupportPageContent } from "@/components/super-admin/support/SupportPageContent";

export default function SupportPage() {
  return (
    <>
      <PageHeader
        title="Support access"
        description="Break-glass support sessions — time-limited and audit-logged."
      />
      <SupportPageContent />
    </>
  );
}

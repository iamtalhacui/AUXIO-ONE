import { PageHeader } from "@/components/dashboard/PageHeader";
import { AuditLogPageContent } from "@/components/super-admin/audit/AuditLogPageContent";

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Immutable record of all meaningful platform actions."
      />
      <AuditLogPageContent />
    </>
  );
}

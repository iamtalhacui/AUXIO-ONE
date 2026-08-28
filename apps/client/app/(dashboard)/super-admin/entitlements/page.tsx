import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntitlementsPageContent } from "@/components/super-admin/entitlements/EntitlementsPageContent";

export default function EntitlementsPage() {
  return (
    <>
      <PageHeader
        title="Entitlements"
        description="Module ceiling grants and enabled status across all organisations."
      />
      <EntitlementsPageContent />
    </>
  );
}

import { PageHeader } from "@/components/dashboard/PageHeader";
import { EntitlementsPageContent } from "@/components/super-admin/entitlements/EntitlementsPageContent";

export default function EntitlementsPage() {
  return (
    <>
      <PageHeader
        title="Entitlements"
        description="Organisations and their module plan grants. Open a row to view modules."
      />
      <EntitlementsPageContent />
    </>
  );
}

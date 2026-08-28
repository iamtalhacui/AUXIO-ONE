import { PageHeader } from "@/components/dashboard/PageHeader";
import { ModuleCataloguePageContent } from "@/components/super-admin/modules/ModuleCataloguePageContent";

export default function ModulesPage() {
  return (
    <>
      <PageHeader
        title="Module catalogue"
        description="All platform modules available for organisation entitlements."
      />
      <ModuleCataloguePageContent />
    </>
  );
}

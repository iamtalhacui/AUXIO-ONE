import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrganisationsPageContent } from "@/components/super-admin/organisations/OrganisationsPageContent";

export default function OrganisationsPage() {
  return (
    <>
      <PageHeader
        title="Organisations"
        description="View and manage all registered tenants on the platform."
      />
      <OrganisationsPageContent />
    </>
  );
}

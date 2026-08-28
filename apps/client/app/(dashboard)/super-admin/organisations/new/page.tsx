import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegisterOrganisationForm } from "@/components/super-admin/organisations/RegisterOrganisationForm";

export default function RegisterOrganisationPage() {
  return (
    <>
      <PageHeader
        title="Register organisation"
        description="W-01 — create a new tenant, grant module ceiling, and invite the first Org Admin."
      />
      <RegisterOrganisationForm />
    </>
  );
}

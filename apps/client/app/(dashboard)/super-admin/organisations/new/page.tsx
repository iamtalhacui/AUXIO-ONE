import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegisterOrganisationForm } from "@/components/super-admin/organisations/RegisterOrganisationForm";

export default function RegisterOrganisationPage() {
  return (
    <>
      <PageHeader
        title="Register organisation"
        description="Create a tenant, choose a plan, and invite the Organisation Admin."
      />
      <RegisterOrganisationForm />
    </>
  );
}

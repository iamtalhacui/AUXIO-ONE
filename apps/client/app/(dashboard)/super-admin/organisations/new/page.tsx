import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegisterOrganisationForm } from "@/components/super-admin/organisations/RegisterOrganisationForm";

export default function RegisterOrganisationPage() {
  return (
    <>
      <PageHeader
        title="Register organisation"
        description="Create a tenant, pick a plan, and invite the Organisation Admin."
        action={
          <Link href="/super-admin/organisations" className="reg-back-btn">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
        }
      />
      <RegisterOrganisationForm />
    </>
  );
}

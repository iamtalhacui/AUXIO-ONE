import { OrganisationEntitlementsContent } from "@/components/super-admin/entitlements/OrganisationEntitlementsContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganisationEntitlementsPage({ params }: PageProps) {
  const { id } = await params;
  return <OrganisationEntitlementsContent organisationId={id} />;
}

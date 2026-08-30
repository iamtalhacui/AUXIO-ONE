import { OrganisationDetailContent } from "@/components/super-admin/organisations/OrganisationDetailContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganisationDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <OrganisationDetailContent organisationId={id} />;
}

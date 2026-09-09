import { OrgAdminTeamMemberViewContent } from "@/components/org-admin/OrgAdminTeamMemberViewContent";

type PageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function OrgAdminTeamMemberViewPage({ params }: PageProps) {
  const { memberId } = await params;
  return <OrgAdminTeamMemberViewContent memberId={memberId} />;
}

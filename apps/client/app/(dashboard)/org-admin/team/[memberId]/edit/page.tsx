import { OrgAdminEditTeamMemberContent } from "@/components/org-admin/OrgAdminEditTeamMemberContent";

type PageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function OrgAdminEditTeamMemberPage({ params }: PageProps) {
  const { memberId } = await params;
  return <OrgAdminEditTeamMemberContent memberId={memberId} />;
}

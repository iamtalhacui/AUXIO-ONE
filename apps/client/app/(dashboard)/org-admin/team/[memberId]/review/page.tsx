import { OrgAdminOnboardingReviewContent } from "@/components/org-admin/OrgAdminOnboardingReviewContent";

type PageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function OrgAdminOnboardingReviewPage({ params }: PageProps) {
  const { memberId } = await params;
  return <OrgAdminOnboardingReviewContent memberId={memberId} />;
}

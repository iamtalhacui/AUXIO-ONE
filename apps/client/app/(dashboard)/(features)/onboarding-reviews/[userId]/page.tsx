"use client";

import { use } from "react";
import { OrgAdminOnboardingReviewContent } from "@/components/org-admin/OrgAdminOnboardingReviewContent";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default function OnboardingReviewDetailPage({ params }: PageProps) {
  const { userId } = use(params);
  return (
    <OrgAdminOnboardingReviewContent
      memberId={userId}
      returnTo="/onboarding-reviews"
    />
  );
}

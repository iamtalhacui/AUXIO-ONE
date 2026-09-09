"use client";

import { use } from "react";
import { OrgAdminOnboardingReviewContent } from "@/components/org-admin/OrgAdminOnboardingReviewContent";

type PageProps = {
  params: Promise<{ memberId: string }>;
};

export default function OrgAdminOnboardingReviewPage({ params }: PageProps) {
  const { memberId } = use(params);
  return <OrgAdminOnboardingReviewContent memberId={memberId} />;
}

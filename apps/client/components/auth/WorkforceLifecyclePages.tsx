"use client";

import { PendingApprovalView } from "@/components/onboarding/PendingApprovalView";
import { WorkerOnboardingFlow } from "@/components/onboarding/WorkerOnboardingFlow";

export function OnboardingPage() {
  return <WorkerOnboardingFlow />;
}

export function PendingApprovalPage() {
  return <PendingApprovalView />;
}

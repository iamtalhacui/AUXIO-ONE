"use client";

import { LockedOnboardingHome } from "@/components/onboarding/LockedOnboardingHome";
import { RoleHomeContent } from "@/components/dashboard/RoleHomeContent";
import { needsOnboardingLock } from "@/lib/onboarding/access";
import { useAppSelector } from "@/lib/store/hooks";

export default function ManagerPage() {
  const user = useAppSelector((state) => state.orgAuth.user);
  const locked = needsOnboardingLock(user?.role, user?.onboardingStatus);

  if (locked) {
    return (
      <LockedOnboardingHome roleLabel="Manager" onboardingHref="/manager/onboarding" />
    );
  }

  return <RoleHomeContent roleLabel="Manager" />;
}

"use client";

import { LockedOnboardingHome } from "@/components/onboarding/LockedOnboardingHome";
import { RosterOverviewDashboard } from "@/components/rostering/dashboard/RosterOverviewDashboard";
import { needsOnboardingLock } from "@/lib/onboarding/access";
import { useAppSelector } from "@/lib/store/hooks";

export default function RosterPage() {
  const user = useAppSelector((state) => state.orgAuth.user);
  const locked = needsOnboardingLock(user?.role, user?.onboardingStatus);

  if (locked) {
    return (
      <LockedOnboardingHome
        roleLabel="Rostering Expert"
        onboardingHref="/roster/onboarding"
      />
    );
  }

  return <RosterOverviewDashboard />;
}

"use client";

import { LockedOnboardingHome } from "@/components/onboarding/LockedOnboardingHome";
import { EmployeeOverviewDashboard } from "@/components/rostering/dashboard/EmployeeOverviewDashboard";
import { needsOnboardingLock } from "@/lib/onboarding/access";
import { useAppSelector } from "@/lib/store/hooks";

export default function EmployeePage() {
  const user = useAppSelector((state) => state.orgAuth.user);
  const locked = needsOnboardingLock(user?.role, user?.onboardingStatus);

  if (locked) {
    return (
      <LockedOnboardingHome roleLabel="Employee" onboardingHref="/employee/onboarding" />
    );
  }

  return <EmployeeOverviewDashboard />;
}

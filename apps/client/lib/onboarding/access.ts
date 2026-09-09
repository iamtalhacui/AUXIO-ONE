import type { UserRole } from "@/lib/dashboard/roles";
import type { DashboardConfig, NavGroup } from "@/lib/dashboard/config";
import type { OnboardingStatus } from "@/lib/api/types";

const WORKFORCE_ROLES: UserRole[] = ["MANAGER", "ROSTERING_EXPERT", "EMPLOYEE"];

/** Workforce users stay locked until onboardingStatus is VERIFIED. */
export function needsOnboardingLock(
  role?: string | null,
  onboardingStatus?: OnboardingStatus | string | null,
) {
  if (!role || !WORKFORCE_ROLES.includes(role as UserRole)) return false;
  return onboardingStatus !== "VERIFIED";
}

export function getLockedWorkspaceNav(basePath: string): NavGroup[] {
  return [
    {
      title: "Workspace",
      items: [
        { label: "Overview", href: basePath, locked: true },
        { label: "Onboarding", href: `${basePath}/onboarding` },
      ],
    },
  ];
}

export function withLockedOnboardingNav(config: DashboardConfig): DashboardConfig {
  return {
    ...config,
    sidebarGroups: getLockedWorkspaceNav(config.basePath),
  };
}

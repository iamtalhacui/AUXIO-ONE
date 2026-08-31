export const WORKFORCE_LIFECYCLE_ROLES = [
  "MANAGER",
  "ROSTERING_EXPERT",
  "EMPLOYEE",
] as const;

export type WorkforceLifecycleRole =
  (typeof WORKFORCE_LIFECYCLE_ROLES)[number];

export type UserLifecycleStatus =
  | "INVITED"
  | "PROCESSING"
  | "SUBMITTED"
  | "VERIFIED"
  | "RESTRICTED"
  | "ACTIVE"
  | "DEACTIVATED";

export function isWorkforceLifecycleRole(role?: string | null) {
  return WORKFORCE_LIFECYCLE_ROLES.includes(role as WorkforceLifecycleRole);
}

export function isWorkforceOperationalStatus(status?: string | null) {
  return status === "VERIFIED" || status === "ACTIVE";
}

/** Redirect workforce users away from role dashboards until verified. */
export function getWorkforceLifecyclePath(
  role?: string | null,
  status?: string | null,
): string | null {
  if (!isWorkforceLifecycleRole(role)) return null;

  if (status === "PROCESSING") return "/onboarding";
  if (status === "SUBMITTED") return "/pending-approval";
  if (!isWorkforceOperationalStatus(status)) return "/onboarding";

  return null;
}

export function getPostAuthPath(
  role?: string,
  status?: string,
  mustChangePassword?: boolean,
  dashboardHome: string = "/login",
) {
  if (mustChangePassword) return "/change-password";

  const lifecyclePath = getWorkforceLifecyclePath(role, status);
  if (lifecyclePath) return lifecyclePath;

  return dashboardHome;
}

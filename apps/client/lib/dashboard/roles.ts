export const USER_ROLES = [
  "SUPER_ADMIN",
  "ORG_ADMIN",
  "MANAGER",
  "ROSTERING_EXPERT",
  "EMPLOYEE",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_HOME: Record<UserRole, string> = {
  SUPER_ADMIN: "/super-admin",
  ORG_ADMIN: "/org-admin",
  MANAGER: "/manager",
  ROSTERING_EXPERT: "/roster",
  EMPLOYEE: "/employee",
};

export function getDashboardHomeForRole(role?: string) {
  if (role && role in ROLE_HOME) {
    return ROLE_HOME[role as UserRole];
  }
  return "/login";
}

/** Org Admin who set a password but Super Admin has not approved yet. */
export function needsPlatformApproval(user?: {
  role?: string;
  platformApproved?: boolean;
} | null) {
  return user?.role === "ORG_ADMIN" && user.platformApproved === false;
}

export function getPostLoginPath(user?: {
  role?: string;
  platformApproved?: boolean;
} | null) {
  if (needsPlatformApproval(user)) return "/platform-approval";
  return getDashboardHomeForRole(user?.role);
}

export function isUserRole(value?: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

/** Workforce roles that follow INVITED → PROCESSING → SUBMITTED → VERIFIED. */
export const WORKFORCE_LIFECYCLE_ROLES = [
  'MANAGER',
  'ROSTERING_EXPERT',
  'EMPLOYEE',
] as const;

export type WorkforceLifecycleRole =
  (typeof WORKFORCE_LIFECYCLE_ROLES)[number];

export function isWorkforceLifecycleRole(roleCode?: string | null) {
  return WORKFORCE_LIFECYCLE_ROLES.includes(
    roleCode as WorkforceLifecycleRole,
  );
}

/** Statuses that allow full role-dashboard access for workforce users. */
export function isWorkforceOperationalStatus(status?: string | null) {
  return status === 'VERIFIED' || status === 'ACTIVE';
}

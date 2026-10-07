/**
 * Client re-exports of the shared role-permission catalog.
 * Source of truth: database/role-permissions
 */
export {
  ACTION_LABELS,
  ACTION_PERMISSIONS,
  CONFIGURABLE_ROLE_META,
  CONFIGURABLE_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  PAGE_LABELS,
  PAGE_MODULE,
  PAGE_PERMISSIONS,
  buildDefaultMatrix,
  fullPermissions,
  isActionPermission,
  isConfigurableRole,
  isPagePermission,
  type ActionPermission,
  type ActionPermissionMap,
  type ConfigurableRole,
  type PagePermission,
  type PagePermissionMap,
  type RolePermissionMatrix,
  type RolePermissions,
} from "database/role-permissions";

/** @deprecated Prefer ConfigurableRole */
export type ConfigurableRoleId = ConfigurableRole;

import {
  CONFIGURABLE_ROLE_META,
  CONFIGURABLE_ROLES,
  type ConfigurableRole,
  type RolePermissionMatrix,
} from "database/role-permissions";

export const CONFIGURABLE_ROLE_CARDS = CONFIGURABLE_ROLES.map((id) => ({
  id,
  ...CONFIGURABLE_ROLE_META[id],
  tint:
    id === "MANAGER"
      ? "bg-primary/10 text-primary"
      : id === "ROSTERING_EXPERT"
        ? "bg-accent/10 text-accent"
        : "bg-emerald-100 text-emerald-800",
  accent:
    id === "MANAGER"
      ? "var(--primary)"
      : id === "ROSTERING_EXPERT"
        ? "var(--accent)"
        : "#0f766e",
}));

export function countGranted(
  matrix: RolePermissionMatrix,
  roleId: ConfigurableRole,
): number {
  const role = matrix[roleId];
  return (
    Object.values(role.pages).filter(Boolean).length +
    Object.values(role.actions).filter(Boolean).length
  );
}

export function cloneMatrix(matrix: RolePermissionMatrix): RolePermissionMatrix {
  const next = {} as RolePermissionMatrix;
  for (const role of CONFIGURABLE_ROLES) {
    next[role] = {
      pages: { ...matrix[role].pages },
      actions: { ...matrix[role].actions },
    };
  }
  return next;
}

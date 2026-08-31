import { CONFIGURABLE_ROLES, type ConfigurableRoleId } from "@/lib/dashboard/content/org-admin-roles";

export const REGISTERABLE_ROLES = CONFIGURABLE_ROLES.map((role) => ({
  code: role.id as ConfigurableRoleId,
  label: role.label,
  description: role.description,
  tint: role.tint,
}));

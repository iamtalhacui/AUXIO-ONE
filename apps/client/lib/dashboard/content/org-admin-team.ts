import {
  CONFIGURABLE_ROLE_CARDS,
  type ConfigurableRole,
} from "@/lib/dashboard/content/org-admin-roles";

export type ConfigurableRoleId = ConfigurableRole;

export const REGISTERABLE_ROLES = CONFIGURABLE_ROLE_CARDS.map((role) => ({
  code: role.id,
  label: role.label,
  description: role.description,
  tint: role.tint,
}));

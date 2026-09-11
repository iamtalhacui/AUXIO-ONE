"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  CONFIGURABLE_ROLES,
  countGrantedPermissions,
  DEFAULT_PERMISSION_MATRIX,
  PERMISSION_GROUPS,
  type ConfigurableRoleId,
} from "@/lib/dashboard/content/org-admin-roles";

function permissionsForRole(roleId: ConfigurableRoleId) {
  const granted = DEFAULT_PERMISSION_MATRIX[roleId];
  return PERMISSION_GROUPS.flatMap((group) =>
    group.permissions
      .filter((permission) => granted[permission.id])
      .map((permission) => ({
        id: permission.id,
        label: permission.label,
        group: group.label,
      })),
  );
}

export function OrgAdminRolesContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Three fixed role templates define what Managers, Rostering Experts, and Employees can do."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {CONFIGURABLE_ROLES.map((role) => {
          const permissions = permissionsForRole(role.id);
          return (
            <article key={role.id} className="dashboard-card flex flex-col p-5">
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${role.tint}`}
              >
                {role.label}
              </span>
              <p className="mt-3 text-sm leading-6 text-muted">{role.description}</p>

              <div className="mt-5 rounded-xl bg-surface-muted/70 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Permissions included
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {countGrantedPermissions(DEFAULT_PERMISSION_MATRIX, role.id)}
                </p>
              </div>

              <ul className="mt-5 space-y-2.5">
                {permissions.map((permission) => (
                  <li key={permission.id} className="flex gap-2.5 text-sm">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: role.accent }}
                      aria-hidden
                    />
                    <span>
                      <span className="font-medium text-foreground">{permission.label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{permission.group}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <div className="dashboard-card border-dashed p-5">
        <p className="text-sm font-semibold">Org Admin is not listed here</p>
        <p className="mt-1 text-sm text-muted">
          Organisation administrators always retain full access. These templates cover Manager,
          Rostering Expert, and Employee only.
        </p>
      </div>
    </div>
  );
}

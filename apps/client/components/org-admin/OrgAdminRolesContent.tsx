"use client";

import { Fragment, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { WorkforceRole } from "@/lib/api/types";
import { CONFIGURABLE_ROLES } from "@/lib/dashboard/content/org-admin-roles";

// Org Admin enables or disables permissions for Manager, Rostering Expert and Employee.
// Every toggle is saved immediately and enforced by the server.
export function OrgAdminRolesContent() {
  const { data, isLoading, error } = useGetRolePermissionsQuery();
  const [updatePermissions, { error: saveError }] = useUpdateRolePermissionsMutation();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function handleToggle(role: WorkforceRole, permissionCode: string, enabled: boolean) {
    setPendingKey(`${role}:${permissionCode}`);
    try {
      await updatePermissions({ changes: [{ role, permissionCode, enabled }] }).unwrap();
    } catch {
      // Shown below via saveError.
    } finally {
      setPendingKey(null);
    }
  }

  const header = (
    <PageHeader
      title="Roles & permissions"
      description="Choose what Managers, Rostering Experts, and Employees can do. Changes apply immediately."
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-sm text-muted">Loading permissions…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-sm text-red-600">
          {getErrorMessage(error, "Could not load role permissions.")}
        </p>
      </div>
    );
  }

  const enabledCount = (role: WorkforceRole) =>
    data.groups.reduce(
      (total, group) => total + group.permissions.filter((p) => p.roles[role]).length,
      0,
    );

  const errorMessage = saveError
    ? getErrorMessage(saveError, "Could not update permission.")
    : null;

  return (
    <div className="space-y-6">
      {header}

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left font-semibold">Permission</th>
              {CONFIGURABLE_ROLES.map((role) => (
                <th key={role.id} className="px-4 py-4 text-center align-bottom">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${role.tint}`}
                  >
                    {role.label}
                  </span>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    {enabledCount(role.id)} enabled
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.groups.map((group) => (
              <Fragment key={group.groupCode}>
                <tr className="bg-surface-muted/70">
                  <td
                    colSpan={1 + CONFIGURABLE_ROLES.length}
                    className="px-6 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted"
                  >
                    {group.groupLabel}
                  </td>
                </tr>
                {group.permissions.map((permission) => (
                  <tr key={permission.code} className="border-t border-border">
                    <td className="px-6 py-3">
                      <p className="font-medium text-foreground">{permission.name}</p>
                      <p className="text-xs text-muted">{permission.description}</p>
                    </td>
                    {CONFIGURABLE_ROLES.map((role) => (
                      <td key={role.id} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${permission.name} for ${role.label}`}
                          checked={permission.roles[role.id]}
                          disabled={pendingKey !== null}
                          onChange={(event) =>
                            handleToggle(role.id, permission.code, event.target.checked)
                          }
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-card border-dashed p-5">
        <p className="text-sm font-semibold">Org Admin is not listed here</p>
        <p className="mt-1 text-sm text-muted">
          Organisation administrators always retain full access and cannot be restricted.
        </p>
      </div>
    </div>
  );
}

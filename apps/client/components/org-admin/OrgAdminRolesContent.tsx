"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PermissionPill } from "@/components/org-admin/roles/PermissionPill";
import {
  useGetOrgRolesQuery,
  useResetOrgRolesMutation,
  useUpdateOrgRolesMutation,
} from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useAppSelector } from "@/lib/store/hooks";
import {
  CONFIGURABLE_ROLES,
  countGrantedPermissions,
  DEFAULT_PERMISSION_MATRIX,
  PERMISSION_GROUPS,
  type ConfigurableRoleId,
  type PermissionId,
  type RolePermissionMatrix,
} from "@/lib/dashboard/content/org-admin-roles";

function matrixFromApiRoles(
  roles: Array<{ code: string; capabilities: Record<string, boolean> }>,
): RolePermissionMatrix {
  const matrix = structuredClone(DEFAULT_PERMISSION_MATRIX);

  for (const role of roles) {
    const roleId = role.code as ConfigurableRoleId;
    if (!matrix[roleId]) continue;

    for (const [key, allowed] of Object.entries(role.capabilities)) {
      matrix[roleId][key as PermissionId] = allowed;
    }
  }

  return matrix;
}

export function OrgAdminRolesContent() {
  const organisationId = useAppSelector((state) => state.auth.user?.organisationId);
  const { data, isLoading, error } = useGetOrgRolesQuery(organisationId ?? "", {
    skip: !organisationId,
  });
  const [updateRoles, { isLoading: isSaving }] = useUpdateOrgRolesMutation();
  const [resetRoles, { isLoading: isResetting }] = useResetOrgRolesMutation();

  const [permissions, setPermissions] = useState<RolePermissionMatrix>(DEFAULT_PERMISSION_MATRIX);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(
    JSON.stringify(DEFAULT_PERMISSION_MATRIX),
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.roles) return;
    const matrix = matrixFromApiRoles(data.roles);
    setPermissions(matrix);
    setSavedSnapshot(JSON.stringify(matrix));
    setSaveMessage(null);
    setActionError(null);
  }, [data]);

  const isDirty = useMemo(
    () => JSON.stringify(permissions) !== savedSnapshot,
    [permissions, savedSnapshot],
  );

  if (!organisationId) {
    return (
      <div className="dashboard-card p-6 text-sm text-muted">
        No organisation is linked to your account.
      </div>
    );
  }

  const orgId = organisationId;

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading roles...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Could not load role permissions")}
      </div>
    );
  }

  function togglePermission(roleId: ConfigurableRoleId, permissionId: PermissionId) {
    setPermissions((current) => ({
      ...current,
      [roleId]: {
        ...current[roleId],
        [permissionId]: !current[roleId][permissionId],
      },
    }));
    setSaveMessage(null);
    setActionError(null);
  }

  async function handleSave() {
    setActionError(null);

    try {
      const result = await updateRoles({
        organisationId: orgId,
        roles: CONFIGURABLE_ROLES.map((role) => ({
          code: role.id,
          capabilities: permissions[role.id],
        })),
      }).unwrap();

      const matrix = matrixFromApiRoles(result.roles);
      setPermissions(matrix);
      setSavedSnapshot(JSON.stringify(matrix));
      setSaveMessage("Role permissions saved.");
    } catch (err) {
      setSaveMessage(null);
      setActionError(getErrorMessage(err, "Could not save role permissions"));
    }
  }

  async function handleReset() {
    setActionError(null);

    try {
      const result = await resetRoles(orgId).unwrap();
      const matrix = matrixFromApiRoles(result.roles);
      setPermissions(matrix);
      setSavedSnapshot(JSON.stringify(matrix));
      setSaveMessage("Role permissions reset to defaults.");
    } catch (err) {
      setSaveMessage(null);
      setActionError(getErrorMessage(err, "Could not reset role permissions"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Configure what Managers, Rostering Experts, and Employees can see and do across your organisation."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isDirty ? (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Unsaved changes
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting || isSaving}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-foreground disabled:opacity-45"
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving || isResetting}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSaving ? "Saving..." : "Save configuration"}
            </button>
          </div>
        }
      />

      {saveMessage ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary">
          {saveMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {CONFIGURABLE_ROLES.map((role) => (
          <article
            key={role.id}
            className="dashboard-card relative overflow-hidden p-5 transition hover:-translate-y-0.5"
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
              style={{ background: `radial-gradient(circle, ${role.accent} 0%, transparent 70%)` }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${role.tint}`}>
                  {role.label}
                </span>
                <p className="mt-3 text-sm leading-6 text-muted">{role.description}</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-surface-muted/70 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Permissions granted</p>
              <p className="mt-1 text-2xl font-semibold">{countGrantedPermissions(permissions, role.id)}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 bg-surface-muted/40 px-6 py-4">
          <p className="text-sm text-muted">
            Tap each pill to grant or deny a permission. Changes apply per role column.
          </p>
        </div>

        <div className="hidden border-b border-border/70 bg-surface px-6 py-4 lg:grid lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Permission</p>
          {CONFIGURABLE_ROLES.map((role) => (
            <p key={role.id} className="text-center text-xs font-bold uppercase tracking-[0.16em] text-muted">
              {role.label}
            </p>
          ))}
        </div>

        {PERMISSION_GROUPS.map((group) => (
          <section key={group.id} className="border-b border-border/60 last:border-b-0">
            <div className="bg-gradient-to-r from-primary/[0.04] to-transparent px-6 py-4">
              <h2 className="text-sm font-semibold">{group.label}</h2>
              <p className="mt-1 text-xs text-muted">{group.description}</p>
            </div>

            <ul>
              {group.permissions.map((permission) => (
                <li
                  key={permission.id}
                  className="grid gap-4 border-t border-border/50 px-6 py-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:items-center"
                >
                  <div>
                    <p className="text-sm font-medium">{permission.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{permission.description}</p>
                  </div>

                  {CONFIGURABLE_ROLES.map((role) => (
                    <div key={role.id} className="flex justify-center lg:justify-center">
                      <PermissionPill
                        granted={permissions[role.id][permission.id]}
                        onToggle={() => togglePermission(role.id, permission.id)}
                        label={`${permission.label} for ${role.label}`}
                      />
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="dashboard-card border-dashed p-5">
        <p className="text-sm font-semibold">Org Admin is not listed here</p>
        <p className="mt-1 text-sm text-muted">
          Organisation administrators always retain full access. This screen only shapes Manager, Rostering Expert, and Employee capabilities.
        </p>
      </div>
    </div>
  );
}

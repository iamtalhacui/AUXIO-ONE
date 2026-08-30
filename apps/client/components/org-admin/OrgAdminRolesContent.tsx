"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ModuleAccessSegment } from "@/components/org-admin/roles/ModuleAccessSegment";
import { PermissionPill } from "@/components/org-admin/roles/PermissionPill";
import {
  CONFIGURABLE_ROLES,
  countGrantedPermissions,
  countModuleAccess,
  DEFAULT_MODULE_MATRIX,
  DEFAULT_PERMISSION_MATRIX,
  PERMISSION_GROUPS,
  ROLE_MODULE_CATALOGUE,
  type ConfigurableRoleId,
  type PermissionId,
  type ModuleAccessLevel,
  type RoleModuleMatrix,
  type RolePermissionMatrix,
} from "@/lib/dashboard/content/org-admin-roles";

type ViewMode = "matrix" | "modules";

export function OrgAdminRolesContent() {
  const [permissions, setPermissions] = useState<RolePermissionMatrix>(DEFAULT_PERMISSION_MATRIX);
  const [modules, setModules] = useState<RoleModuleMatrix>(DEFAULT_MODULE_MATRIX);
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [savedSnapshot, setSavedSnapshot] = useState<string>(
    JSON.stringify({ permissions: DEFAULT_PERMISSION_MATRIX, modules: DEFAULT_MODULE_MATRIX }),
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify({ permissions, modules }) !== savedSnapshot,
    [permissions, modules, savedSnapshot],
  );

  function togglePermission(roleId: ConfigurableRoleId, permissionId: PermissionId) {
    setPermissions((current) => ({
      ...current,
      [roleId]: {
        ...current[roleId],
        [permissionId]: !current[roleId][permissionId],
      },
    }));
    setSaveMessage(null);
  }

  function setModuleAccess(roleId: ConfigurableRoleId, moduleCode: string, level: ModuleAccessLevel) {
    setModules((current) => ({
      ...current,
      [roleId]: {
        ...current[roleId],
        [moduleCode]: level,
      },
    }));
    setSaveMessage(null);
  }

  function handleSave() {
    setSavedSnapshot(JSON.stringify({ permissions, modules }));
    setSaveMessage("Role configuration saved locally. Backend wiring comes next.");
  }

  function handleReset() {
    setPermissions(DEFAULT_PERMISSION_MATRIX);
    setModules(DEFAULT_MODULE_MATRIX);
    setSaveMessage(null);
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
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-foreground"
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-45"
            >
              Save configuration
            </button>
          </div>
        }
      />

      {saveMessage ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary">
          {saveMessage}
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
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-muted/70 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Permissions</p>
                <p className="mt-1 text-2xl font-semibold">{countGrantedPermissions(permissions, role.id)}</p>
              </div>
              <div className="rounded-xl bg-surface-muted/70 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Modules</p>
                <p className="mt-1 text-2xl font-semibold">{countModuleAccess(modules, role.id)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { id: "matrix" as const, label: "Permission matrix" },
          { id: "modules" as const, label: "Module access" },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setViewMode(tab.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              viewMode === tab.id
                ? "bg-primary text-white shadow-[0_10px_30px_rgba(17,94,89,0.22)]"
                : "border border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {viewMode === "matrix" ? (
        <div className="space-y-5">
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
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {ROLE_MODULE_CATALOGUE.map((module) => (
            <article
              key={module.code}
              className="dashboard-card group overflow-hidden transition hover:shadow-[0_16px_48px_rgba(35,32,28,0.08)]"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{module.code}</span>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Module
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold">{module.name}</h3>
                  <p className="mt-1 text-sm text-muted">{module.description}</p>
                </div>
              </div>

              <div className="border-t border-border/60 bg-surface-muted/25 px-5 py-4">
                <div className="space-y-3">
                  {CONFIGURABLE_ROLES.map((role) => (
                    <div
                      key={role.id}
                      className="flex flex-col gap-2 rounded-xl border border-border/50 bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${role.tint}`}>
                          {role.label}
                        </span>
                      </div>
                      <ModuleAccessSegment
                        compact
                        value={modules[role.id][module.code]}
                        onChange={(level) => setModuleAccess(role.id, module.code, level)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="dashboard-card border-dashed p-5">
        <p className="text-sm font-semibold">Org Admin is not listed here</p>
        <p className="mt-1 text-sm text-muted">
          Organisation administrators always retain full access. This screen only shapes Manager, Rostering Expert, and Employee capabilities.
        </p>
      </div>
    </div>
  );
}

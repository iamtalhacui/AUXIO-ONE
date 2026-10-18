"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import {
  ACTION_LABELS,
  ACTION_PERMISSIONS,
  CONFIGURABLE_ROLE_CARDS,
  CONFIGURABLE_ROLES,
  PAGE_LABELS,
  PAGE_PERMISSIONS,
  buildDefaultMatrix,
  cloneMatrix,
  countGranted,
  type ActionPermission,
  type ConfigurableRole,
  type PagePermission,
  type RolePermissionMatrix,
} from "@/lib/dashboard/content/org-admin-roles";
import { useToast } from "@/components/toast/ToastProvider";

function ToggleRow({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface-muted/60"
    >
      <span className="text-sm text-foreground">{label}</span>
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 accent-[var(--primary)]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function OrgAdminRolesContent() {
  const { toast } = useToast();
  const { data, isLoading, error } = useGetRolePermissionsQuery();
  const [updateMatrix, { isLoading: saving }] = useUpdateRolePermissionsMutation();
  const [activeRole, setActiveRole] = useState<ConfigurableRole>("MANAGER");
  const [draft, setDraft] = useState<RolePermissionMatrix>(() => buildDefaultMatrix());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDraft(cloneMatrix(data as RolePermissionMatrix));
    setDirty(false);
  }, [data]);

  const granted = useMemo(
    () => countGranted(draft, activeRole),
    [activeRole, draft],
  );

  function setPage(page: PagePermission, enabled: boolean) {
    setDraft((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        pages: { ...prev[activeRole].pages, [page]: enabled },
      },
    }));
    setDirty(true);
  }

  function setAction(action: ActionPermission, enabled: boolean) {
    // Approve Onboarding can only be granted to Manager.
    if (action === "APPROVE_ONBOARDING" && activeRole !== "MANAGER") {
      return;
    }
    setDraft((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        actions: { ...prev[activeRole].actions, [action]: enabled },
      },
    }));
    setDirty(true);
  }

  async function onSave() {
    try {
      const saved = await updateMatrix(draft).unwrap();
      setDraft(cloneMatrix(saved as RolePermissionMatrix));
      setDirty(false);
      toast({ title: "Role permissions saved", variant: "success" });
    } catch (err) {
      toast({
        title: getErrorMessage(err, "Could not save permissions"),
        variant: "error",
      });
    }
  }

  function onResetRole() {
    const defaults = buildDefaultMatrix();
    setDraft((prev) => ({
      ...prev,
      [activeRole]: {
        pages: { ...defaults[activeRole].pages },
        actions: { ...defaults[activeRole].actions },
      },
    }));
    setDirty(true);
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading role permissions…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load role permissions")}
      </p>
    );
  }

  const roleMeta = CONFIGURABLE_ROLE_CARDS.find((r) => r.id === activeRole)!;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Enable page access and action permissions for Managers, Rostering Experts, and Employees. Page access does not grant actions automatically. Modules still apply as a separate ceiling."
      />

      <div className="flex flex-wrap gap-2">
        {CONFIGURABLE_ROLES.map((roleId) => {
          const meta = CONFIGURABLE_ROLE_CARDS.find((r) => r.id === roleId)!;
          const selected = activeRole === roleId;
          return (
            <button
              key={roleId}
              type="button"
              onClick={() => setActiveRole(roleId)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-foreground hover:bg-surface-muted/80"
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="dashboard-card space-y-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${roleMeta.tint}`}>
              {roleMeta.label}
            </p>
            <p className="mt-2 text-sm text-muted">{roleMeta.description}</p>
            <p className="mt-2 text-xs text-muted">
              {granted} permissions currently enabled
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted"
              onClick={onResetRole}
              disabled={saving}
            >
              Reset to defaults
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              onClick={onSave}
              disabled={!dirty || saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        <section>
          <h2 className="text-sm font-semibold">Page access</h2>
          <p className="mt-1 text-xs text-muted">
            Controls which areas appear in navigation. Does not grant actions on those pages.
          </p>
          <div className="mt-3 divide-y divide-border/70 rounded-xl border border-border/80">
            {PAGE_PERMISSIONS.map((page) => (
              <ToggleRow
                key={page}
                id={`page-${activeRole}-${page}`}
                label={PAGE_LABELS[page]}
                checked={draft[activeRole].pages[page]}
                onChange={(next) => setPage(page, next)}
                disabled={saving}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Action permissions</h2>
          <p className="mt-1 text-xs text-muted">
            Business actions this role may perform when the related module is enabled.
          </p>
          <div className="mt-3 divide-y divide-border/70 rounded-xl border border-border/80">
            {ACTION_PERMISSIONS.filter(
              (action) =>
                // Approve Onboarding is Manager-only (Org Admin always has it).
                action !== "APPROVE_ONBOARDING" || activeRole === "MANAGER",
            ).map((action) => (
              <ToggleRow
                key={action}
                id={`action-${activeRole}-${action}`}
                label={ACTION_LABELS[action]}
                checked={draft[activeRole].actions[action]}
                onChange={(next) => setAction(action, next)}
                disabled={saving}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-card border-dashed p-5">
        <p className="text-sm font-semibold">Org Admin is not listed here</p>
        <p className="mt-1 text-sm text-muted">
          Organisation administrators always retain full access. Security-critical settings,
          billing, and personal account actions stay non-configurable.
        </p>
      </div>
    </div>
  );
}

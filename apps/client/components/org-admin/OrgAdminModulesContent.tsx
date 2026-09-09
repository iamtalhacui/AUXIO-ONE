"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useListOrgModulesQuery,
  useSetOrgModuleEnabledMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

// Org Admin toggles plan-included modules for their own organisation.
export function OrgAdminModulesContent() {
  const { data: modules = [], isLoading, error } = useListOrgModulesQuery();
  const [setEnabled, { isLoading: isSaving, error: saveError }] =
    useSetOrgModuleEnabledMutation();
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  async function handleToggle(code: string, enabled: boolean) {
    setPendingCode(code);
    try {
      await setEnabled({ code, enabled }).unwrap();
    } catch {
      // RTK error
    } finally {
      setPendingCode(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading modules…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load modules.")}
      </p>
    );
  }

  if (!modules.length) {
    return (
      <div className="dashboard-card p-6 text-sm text-muted">
        No modules have been granted to this organisation yet.
      </div>
    );
  }

  const errorMessage = saveError
    ? getErrorMessage(saveError, "Could not update module.")
    : null;

  return (
    <>
      <PageHeader
        title="Modules"
        description="Enable modules within your organisation ceiling."
      />
      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <p className="text-sm text-muted">
            Only modules in your plan are listed here. Enable the ones your organisation is ready to use.
          </p>
        </div>

        {errorMessage ? (
          <p className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <ul className="divide-y divide-border">
          {modules.map((mod) => (
            <li
              key={mod.code}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="text-sm font-semibold">{mod.name}</p>
                <p className="text-xs text-muted">{mod.description || `Code ${mod.code}`}</p>
              </div>

              <label className="inline-flex items-center gap-3 text-sm">
                <span className={mod.enabled ? "text-primary" : "text-muted"}>
                  {mod.enabled ? "Enabled" : "Disabled"}
                </span>
                <input
                  type="checkbox"
                  checked={mod.enabled}
                  disabled={isSaving && pendingCode === mod.code}
                  onChange={(event) => handleToggle(mod.code, event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
              </label>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

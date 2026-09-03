"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { mockEntitlements, type ModuleEntitlementSummary } from "@/lib/mocks/data";

export function OrgAdminModulesContent() {
  const [entitlements, setEntitlements] = useState<ModuleEntitlementSummary[]>(() =>
    mockEntitlements.map((item) => ({ ...item })),
  );

  function handleToggle(moduleCode: string, enabled: boolean) {
    setEntitlements((current) =>
      current.map((item) =>
        item.moduleCode === moduleCode ? { ...item, enabled } : item,
      ),
    );
  }

  if (!entitlements.length) {
    return (
      <div className="dashboard-card p-6 text-sm text-muted">
        No modules have been granted to this organisation yet.
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Modules" description="Enable modules within your organisation ceiling." />
      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <p className="text-sm text-muted">
            Only modules in your ceiling are listed here. Enable the ones your organisation is ready to use.
          </p>
        </div>

        <ul className="divide-y divide-border">
          {entitlements.map((entitlement) => (
            <li
              key={entitlement.moduleCode}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="text-sm font-semibold">{entitlement.moduleName}</p>
                <p className="text-xs text-muted">Code {entitlement.moduleCode}</p>
              </div>

              <label className="inline-flex items-center gap-3 text-sm">
                <span className={entitlement.enabled ? "text-primary" : "text-muted"}>
                  {entitlement.enabled ? "Enabled" : "Disabled"}
                </span>
                <input
                  type="checkbox"
                  checked={entitlement.enabled}
                  onChange={(event) =>
                    handleToggle(entitlement.moduleCode, event.target.checked)
                  }
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

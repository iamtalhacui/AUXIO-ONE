"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { useAppSelector } from "@/lib/store/hooks";
import {
  useListOrgModulesQuery,
  useToggleOrgModuleMutation,
} from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

export function OrgAdminModulesContent() {
  const organisationId = useAppSelector((state) => state.auth.user?.organisationId);
  const { data, isLoading, error } = useListOrgModulesQuery(organisationId ?? "", {
    skip: !organisationId,
  });
  const [toggleModule, { isLoading: isToggling }] = useToggleOrgModuleMutation();

  if (!organisationId) {
    return (
      <div className="dashboard-card p-6 text-sm text-muted">
        No organisation is linked to your account.
      </div>
    );
  }

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading modules...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Could not load modules")}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="dashboard-card p-6 text-sm text-muted">
        No modules have been granted to this organisation yet.
      </div>
    );
  }

  async function handleToggle(moduleCode: string, enabled: boolean) {
    if (!organisationId) return;

    try {
      await toggleModule({ organisationId, moduleCode, enabled }).unwrap();
    } catch {
      // RTK Query surfaces errors via hook state on refetch; keep UI simple.
    }
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
        {data.map((entitlement) => (
          <li
            key={entitlement.id}
            className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
          >
            <div>
              <p className="text-sm font-semibold">{entitlement.module.name}</p>
              <p className="text-xs text-muted">Code {entitlement.module.code}</p>
            </div>

            <label className="inline-flex items-center gap-3 text-sm">
              <span className={entitlement.enabled ? "text-primary" : "text-muted"}>
                {entitlement.enabled ? "Enabled" : "Disabled"}
              </span>
              <input
                type="checkbox"
                checked={entitlement.enabled}
                disabled={isToggling}
                onChange={(event) =>
                  handleToggle(entitlement.module.code, event.target.checked)
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

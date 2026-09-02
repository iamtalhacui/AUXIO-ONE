"use client";

import { useListPlatformEntitlementsQuery } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EntitlementsPageContent() {
  const { data: entitlements = [], isLoading, error } = useListPlatformEntitlementsQuery();

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading entitlements...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Could not load entitlements")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Total entitlements</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{entitlements.length}</p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Enabled</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {entitlements.filter((e) => e.enabled).length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Ceiling only</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {entitlements.filter((e) => !e.enabled).length}
          </p>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Module entitlements</h2>
          <p className="text-sm text-muted">Ceiling grants and enabled status per organisation</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Organisation</th>
                <th className="px-6 py-3 font-semibold">Module</th>
                <th className="px-6 py-3 font-semibold">Ceiling</th>
                <th className="px-6 py-3 font-semibold">Enabled</th>
                <th className="px-6 py-3 font-semibold">Granted</th>
              </tr>
            </thead>
            <tbody>
              {entitlements.map((row) => (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="px-6 py-4 font-medium">{row.organisationName}</td>
                  <td className="px-6 py-4">
                    <p>{row.moduleName}</p>
                    <p className="text-xs text-muted">{row.moduleCode}</p>
                  </td>
                  <td className="px-6 py-4">{row.ceilingGranted ? "Yes" : "No"}</td>
                  <td className="px-6 py-4">{row.enabled ? "Yes" : "No"}</td>
                  <td className="px-6 py-4 text-muted">{formatDate(row.grantedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useGetOrganisationQuery } from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

export function OrganisationEntitlementsContent({
  organisationId,
}: {
  organisationId: string;
}) {
  const { data: org, isLoading, error } = useGetOrganisationQuery(organisationId);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading entitlements…</p>;
  }

  if (error || !org) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load entitlements for this organisation.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/super-admin/entitlements"
        className="inline-flex text-sm font-medium text-muted hover:text-primary"
      >
        ← Back to entitlements
      </Link>

      <div className="dashboard-card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          Organisation
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{org.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Plan {org.plan} · {org.modulesEnabled} enabled / {org.modulesGranted}{" "}
          granted
        </p>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Module entitlements</h2>
          <p className="text-sm text-muted">
            Modules included in this organisation&apos;s plan
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Module</th>
                <th className="px-6 py-3 font-semibold">Code</th>
                <th className="px-6 py-3 font-semibold">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {org.modules.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted">
                    No modules granted.
                  </td>
                </tr>
              ) : (
                org.modules.map((module) => (
                  <tr key={module.code} className="border-t border-border/60">
                    <td className="px-6 py-4">
                      <p className="font-medium">{module.name}</p>
                      {module.description ? (
                        <p className="text-xs text-muted">{module.description}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{module.code}</td>
                    <td className="px-6 py-4">{module.enabled ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

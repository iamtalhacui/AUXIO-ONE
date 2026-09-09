"use client";

import Link from "next/link";
import { OrgStatusBadge } from "@/components/dashboard/StatusBadge";
import { useGetOrganisationQuery } from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrganisationDetailContent({ organisationId }: { organisationId: string }) {
  const { data: org, isLoading, error } = useGetOrganisationQuery(organisationId);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading organisation…</p>;
  }

  if (error || !org) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load this organisation.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/super-admin/organisations"
        className="inline-flex text-sm font-medium text-muted hover:text-primary"
      >
        ← Back to organisations
      </Link>

      <div className="dashboard-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Tenant</p>
            <h1 className="mt-2 text-2xl font-semibold">{org.name}</h1>
            <p className="mt-1 text-sm text-muted">{org.email}</p>
          </div>
          <OrgStatusBadge status={org.status} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Registered {formatDate(org.createdAt)} · Plan {org.plan} · Time zone {org.timezone}
        </p>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Organisation details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Contact email</dt>
            <dd className="mt-1 text-sm font-medium">{org.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Contact phone</dt>
            <dd className="mt-1 text-sm font-medium">{org.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Plan</dt>
            <dd className="mt-1 text-sm font-medium">{org.plan}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Modules</dt>
            <dd className="mt-1 text-sm font-medium">
              {org.modulesEnabled} enabled / {org.modulesGranted} granted
            </dd>
          </div>
        </dl>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Org Admin</h2>
        {org.admin ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
              <dd className="mt-1 text-sm font-medium">
                {org.admin.firstName} {org.admin.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
              <dd className="mt-1 text-sm font-medium">{org.admin.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Account status</dt>
              <dd className="mt-1 text-sm font-medium">{org.admin.status}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-muted">No Org Admin linked to this organisation.</p>
        )}
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Granted modules</h2>
          <p className="text-sm text-muted">Modules included in this organisation&apos;s plan</p>
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
                    <td className="px-6 py-4 font-medium">{module.name}</td>
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

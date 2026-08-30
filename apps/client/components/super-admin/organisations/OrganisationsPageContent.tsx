"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useListOrganisationsQuery } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { OrgStatus } from "@/lib/api/types";
import { OrgStatusBadge } from "@/components/dashboard/StatusBadge";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrganisationsPageContent() {
  const { data: organisations = [], isLoading, error } = useListOrganisationsQuery();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return organisations.filter((org) => {
      const search = query.toLowerCase();
      const matchesQuery =
        query === "" ||
        (org.tradingName ?? "").toLowerCase().includes(search) ||
        org.legalName.toLowerCase().includes(search) ||
        org.contactEmail.toLowerCase().includes(search);
      const matchesStatus = statusFilter === "ALL" || org.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [organisations, query, statusFilter]);

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading organisations...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Could not load organisations")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: organisations.length },
          {
            label: "Active",
            value: organisations.filter((org) => org.status === "ACTIVE").length,
          },
          {
            label: "Suspended",
            value: organisations.filter((org) => org.status === "SUSPENDED").length,
          },
        ].map((stat) => (
          <div key={stat.label} className="dashboard-card p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border/70 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">All organisations</h2>
            <p className="text-sm text-muted">{filtered.length} tenants shown</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search organisations..."
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CLOSED">Closed</option>
            </select>
            <Link
              href="/super-admin/organisations/new"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
            >
              Register organisation
            </Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted">
            No organisations match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">Organisation</th>
                  <th className="px-6 py-3 font-semibold">Contact</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Modules</th>
                  <th className="px-6 py-3 font-semibold">Org Admin</th>
                  <th className="px-6 py-3 font-semibold">Registered</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr key={org.id} className="border-t border-border/60">
                    <td className="px-6 py-4">
                      <p className="font-medium">{org.tradingName ?? org.legalName}</p>
                      <p className="text-xs text-muted">{org.legalName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-muted">{org.contactEmail}</p>
                      <p className="text-xs text-muted">{org.timeZone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <OrgStatusBadge status={org.status as OrgStatus} />
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {org.modulesEnabled}/{org.modulesGranted} enabled
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {org.orgAdminEmail ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-muted">{formatDate(org.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/super-admin/organisations/${org.id}`}
                        className="text-sm font-semibold text-primary hover:text-primary-light"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

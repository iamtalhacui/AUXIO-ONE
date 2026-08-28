"use client";

import Link from "next/link";
import { useState } from "react";
import { organisations } from "@/lib/dashboard/content/super-admin";
import { OrgStatusBadge } from "@/components/dashboard/StatusBadge";

export function OrganisationsPageContent() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = organisations.filter((org) => {
    const matchesQuery =
      query === "" ||
      org.tradingName.toLowerCase().includes(query.toLowerCase()) ||
      org.legalName.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || org.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: organisations.length },
          { label: "Active", value: organisations.filter((o) => o.status === "ACTIVE").length },
          { label: "Suspended", value: organisations.filter((o) => o.status === "SUSPENDED").length },
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search organisations..."
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
                    <p className="font-medium">{org.tradingName}</p>
                    <p className="text-xs text-muted">{org.legalName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-muted">{org.contactEmail}</p>
                    <p className="text-xs text-muted">{org.timeZone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <OrgStatusBadge status={org.status} />
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {org.modulesEnabled}/{org.modulesGranted} enabled
                  </td>
                  <td className="px-6 py-4 text-muted">{org.orgAdmin}</td>
                  <td className="px-6 py-4 text-muted">{org.createdAt}</td>
                  <td className="px-6 py-4">
                    <button type="button" className="text-sm font-semibold text-primary hover:text-primary-light">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

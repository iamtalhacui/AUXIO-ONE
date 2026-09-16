"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useListOrganisationsQuery } from "@/lib/api/platformAuthApi";
import { OrgStatusBadge } from "@/components/dashboard/StatusBadge";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const APPROVAL_LABEL: Record<string, string> = {
  INVITED: "Invited",
  AWAITING_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// Super Admin tenant list from GET /platform/organisations.
export function OrganisationsPageContent() {
  const { data: organisations = [], isLoading, error } = useListOrganisationsQuery();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return organisations;
    return organisations.filter(
      (org) =>
        org.name.toLowerCase().includes(search) ||
        org.email.toLowerCase().includes(search) ||
        (org.admin?.email ?? "").toLowerCase().includes(search),
    );
  }, [organisations, query]);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading organisations…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Could not load organisations.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search…"
          className="input-field max-w-xs"
        />
        <Link href="/super-admin/organisations/new" className="btn-primary">
          Register organisation
        </Link>
      </div>

      <p className="text-sm text-muted">
        Open an organisation to approve or reject the Org Admin, or change their login email.
      </p>

      <div className="data-table-wrap">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No organisations yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Admin</th>
                <th>Admin approval</th>
                <th>Registered</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => {
                const approval = org.admin?.approvalStatus;
                const needsReview =
                  approval === "AWAITING_APPROVAL" || approval === "INVITED";

                return (
                  <tr key={org.id}>
                    <td>
                      <Link
                        href={`/super-admin/organisations/${org.id}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {org.name}
                      </Link>
                      <p className="text-xs text-muted">{org.email}</p>
                    </td>
                    <td className="text-muted">{org.plan}</td>
                    <td>
                      <OrgStatusBadge status={org.status} />
                    </td>
                    <td className="text-muted">
                      {org.admin
                        ? `${org.admin.firstName} ${org.admin.lastName}`
                        : "—"}
                      {org.admin ? (
                        <p className="text-xs">{org.admin.email}</p>
                      ) : null}
                    </td>
                    <td>
                      {approval ? (
                        <span
                          className={
                            approval === "AWAITING_APPROVAL"
                              ? "rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800"
                              : approval === "REJECTED"
                                ? "rounded-md bg-red-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-red-800"
                                : "text-xs text-muted"
                          }
                        >
                          {APPROVAL_LABEL[approval] ?? approval}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="text-muted">{formatDate(org.createdAt)}</td>
                    <td className="text-right">
                      <Link
                        href={`/super-admin/organisations/${org.id}`}
                        className={
                          needsReview
                            ? "btn-primary inline-flex px-3 py-1.5 text-xs"
                            : "btn-secondary inline-flex px-3 py-1.5 text-xs"
                        }
                      >
                        {needsReview ? "Review" : "Manage"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

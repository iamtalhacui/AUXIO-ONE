"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useListOrganisationsQuery } from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

export function EntitlementsPageContent() {
  const { data: organisations = [], isLoading, error } = useListOrganisationsQuery();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return organisations;
    return organisations.filter(
      (org) =>
        org.name.toLowerCase().includes(search) ||
        org.plan.toLowerCase().includes(search),
    );
  }, [organisations, query]);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading organisations…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load organisations.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search organisations…"
        className="input-field max-w-xs"
      />

      <div className="data-table-wrap">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            No organisations yet.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Plan</th>
                <th>Modules</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => (
                <tr key={org.id}>
                  <td>
                    <Link
                      href={`/super-admin/entitlements/${org.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td className="text-muted">{org.plan}</td>
                  <td className="text-muted">
                    {org.modulesEnabled} enabled / {org.modulesGranted} granted
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

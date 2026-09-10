"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useListCustomersQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

function statusClass(status: string) {
  if (status === "ACTIVE") return "bg-primary/10 text-primary";
  if (status === "ONBOARDING") return "bg-accent/10 text-accent";
  return "bg-surface-muted text-muted";
}

export function ManagerCustomersContent() {
  const { data: customers = [], isLoading, error } = useListCustomersQuery();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.serviceLine.toLowerCase().includes(q),
    );
  }, [customers, query]);

  if (isLoading) return <p className="text-sm text-muted">Loading customers…</p>;
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load customers. Is the CUSTOMERS module enabled?")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description="Create customer records and complete document onboarding."
        action={
          <Link href="/manager/customers/new" className="btn-primary">
            Register customer
          </Link>
        }
      />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email, or service line…"
        className="input-field max-w-md"
      />

      <div className="data-table-wrap">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No customers yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Service line</th>
                <th>Status</th>
                <th>Docs</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const done = customer.mandatoryDocs.filter((d) => d.uploaded).length;
                const total = customer.mandatoryDocs.length;
                return (
                  <tr key={customer.id}>
                    <td>
                      <p className="font-medium">{customer.displayName}</p>
                      <p className="text-xs text-muted">{customer.email || "—"}</p>
                    </td>
                    <td className="text-muted">{customer.serviceLine || "—"}</td>
                    <td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(customer.status)}`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="text-muted">
                      {done}/{total} required
                    </td>
                    <td>
                      <Link
                        href={`/manager/customers/${customer.id}`}
                        className="text-sm font-semibold text-primary"
                      >
                        Open
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

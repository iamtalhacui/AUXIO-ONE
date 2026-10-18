"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DemoStatusBadge } from "@/components/dashboard/StatusBadge";
import { ConstrainedSelect } from "@/components/ui/ConstrainedSelect";
import { useListDemoRequestsQuery } from "@/lib/api/platformAuthApi";
import type { DemoRequestStatus } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_FILTERS: Array<DemoRequestStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "CONTACTED",
  "COMPLETED",
];

export function DemoRequestsPageContent() {
  const { data: requests = [], isLoading, error } = useListDemoRequestsQuery();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DemoRequestStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter !== "ALL" && request.status !== statusFilter) return false;
      if (!search) return true;
      return (
        request.organisationName.toLowerCase().includes(search) ||
        request.contactName.toLowerCase().includes(search) ||
        request.email.toLowerCase().includes(search)
      );
    });
  }, [requests, query, statusFilter]);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading demo requests…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load demo requests.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search organisation, contact, email…"
          className="input-field w-full min-w-0 sm:max-w-sm"
        />
        <ConstrainedSelect
          className="w-full sm:max-w-[10rem]"
          aria-label="Status filter"
          value={statusFilter}
          onChange={(next) => setStatusFilter(next as DemoRequestStatus | "ALL")}
          options={STATUS_FILTERS.map((status) => ({
            value: status,
            label: status === "ALL" ? "All statuses" : status,
          }))}
        />
      </div>

      <div className="data-table-wrap">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            No demo requests yet.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Contact</th>
                <th>Preferred</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Link
                      href={`/super-admin/demos/${request.id}`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {request.organisationName}
                    </Link>
                  </td>
                  <td>
                    <p className="font-medium">{request.contactName}</p>
                    <p className="text-xs text-muted">{request.email}</p>
                  </td>
                  <td className="text-muted">
                    {formatDate(request.preferredDate)}
                    <p className="text-xs">{request.preferredTime}</p>
                  </td>
                  <td>
                    <DemoStatusBadge status={request.status} />
                  </td>
                  <td className="text-muted">{formatDate(request.createdAt)}</td>
                  <td className="text-right">
                    <Link
                      href={`/super-admin/demos/${request.id}`}
                      className={
                        request.status === "PENDING"
                          ? "btn-primary inline-flex px-3 py-1.5 text-xs"
                          : "btn-secondary inline-flex px-3 py-1.5 text-xs"
                      }
                    >
                      {request.status === "PENDING" ? "Review" : "Open"}
                    </Link>
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

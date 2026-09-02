"use client";

import { useListPlatformAuditQuery } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { ActionBadge } from "@/components/dashboard/StatusBadge";

function formatAuditDetails(entry: {
  afterJson: unknown;
  entityType: string;
  organisation?: { tradingName: string | null; legalName: string } | null;
}) {
  const orgName =
    entry.organisation?.tradingName ?? entry.organisation?.legalName ?? null;
  if (orgName) return `${entry.entityType} · ${orgName}`;
  return entry.entityType;
}

export function AuditLogPageContent() {
  const { data: auditLog = [], isLoading, error } = useListPlatformAuditQuery();

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading audit log...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Could not load audit log")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Platform audit log</h2>
            <p className="text-sm text-muted">Actions performed by platform administrators</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Action</th>
                <th className="px-6 py-3 font-semibold">Entity</th>
                <th className="px-6 py-3 font-semibold">Details</th>
                <th className="px-6 py-3 font-semibold">Actor</th>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted">
                    No platform audit entries yet.
                  </td>
                </tr>
              ) : (
                auditLog.map((entry) => (
                  <tr key={entry.id} className="border-t border-border/60">
                    <td className="px-6 py-4">
                      <ActionBadge action={entry.action} />
                    </td>
                    <td className="px-6 py-4 font-medium">{entry.entityType}</td>
                    <td className="px-6 py-4 text-muted">{formatAuditDetails(entry)}</td>
                    <td className="px-6 py-4">{entry.actor?.name ?? "System"}</td>
                    <td className="px-6 py-4 text-muted">
                      {new Date(entry.createdAt).toLocaleString("en-AU")}
                    </td>
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

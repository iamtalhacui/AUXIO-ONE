"use client";

import { ActionBadge } from "@/components/dashboard/StatusBadge";
import { useListPlatformAuditQuery } from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

export function AuditLogPageContent() {
  const { data: auditLog = [], isLoading, error } = useListPlatformAuditQuery();

  if (isLoading) {
    return <p className="text-sm text-muted">Loading audit log…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load the audit log.")}
      </p>
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
            <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted">
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
                    <td className="px-6 py-4 font-medium">
                      {entry.organisationName ?? "Platform"}
                    </td>
                    <td className="px-6 py-4 text-muted">{entry.details || "—"}</td>
                    <td className="px-6 py-4">{entry.actorEmail}</td>
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

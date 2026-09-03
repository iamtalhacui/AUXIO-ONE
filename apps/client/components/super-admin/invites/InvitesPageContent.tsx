"use client";

import { mockInvites } from "@/lib/mocks/data";
import { InviteStatusBadge } from "@/components/dashboard/StatusBadge";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const invites = mockInvites.map((invite) => ({
  id: invite.id,
  name: invite.email.split("@")[0] ?? invite.email,
  email: invite.email,
  organisation: invite.organisationName,
  role: "ORG_ADMIN",
  invitedAt: invite.createdAt,
  rawStatus: invite.status,
  status: (invite.status === "PENDING" ? "INVITED" : "EXPIRED") as "INVITED" | "EXPIRED",
}));

export function InvitesPageContent() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Invited</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {invites.filter((i) => i.status === "INVITED").length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Onboarding</p>
          <p className="mt-2 text-3xl font-semibold text-accent">
            {invites.filter((i) => i.rawStatus === "PROCESSING").length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Total pending</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{invites.length}</p>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Pending workforce accounts</h2>
          <p className="text-sm text-muted">Users invited but not yet verified</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Organisation</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Invited</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted">
                    No pending invites.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id} className="border-t border-border/60">
                    <td className="px-6 py-4 font-medium">{invite.name}</td>
                    <td className="px-6 py-4 text-muted">{invite.email}</td>
                    <td className="px-6 py-4">{invite.organisation}</td>
                    <td className="px-6 py-4">{invite.role}</td>
                    <td className="px-6 py-4 text-muted">{formatDate(invite.invitedAt)}</td>
                    <td className="px-6 py-4">
                      <InviteStatusBadge status={invite.status} />
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

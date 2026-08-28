import { pendingInvites } from "@/lib/dashboard/content/super-admin";
import { InviteStatusBadge } from "@/components/dashboard/StatusBadge";

export function InvitesPageContent() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {pendingInvites.filter((i) => i.status === "INVITED").length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Expired</p>
          <p className="mt-2 text-3xl font-semibold text-accent">
            {pendingInvites.filter((i) => i.status === "EXPIRED").length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Total sent</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{pendingInvites.length}</p>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Org Admin invitations</h2>
          <p className="text-sm text-muted">First Org Admin accounts awaiting activation</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Organisation</th>
                <th className="px-6 py-3 font-semibold">Invited</th>
                <th className="px-6 py-3 font-semibold">Expires</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvites.map((invite) => (
                <tr key={invite.id} className="border-t border-border/60">
                  <td className="px-6 py-4 font-medium">{invite.name}</td>
                  <td className="px-6 py-4 text-muted">{invite.email}</td>
                  <td className="px-6 py-4">{invite.organisation}</td>
                  <td className="px-6 py-4 text-muted">{invite.invitedAt}</td>
                  <td className="px-6 py-4 text-muted">{invite.expiresAt}</td>
                  <td className="px-6 py-4">
                    <InviteStatusBadge status={invite.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" className="text-sm font-semibold text-primary">
                      Resend
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

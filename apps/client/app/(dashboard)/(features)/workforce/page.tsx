"use client";

import Link from "next/link";
import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useListOrgTeamQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useHasAction } from "@/lib/permissions/hooks";

function WorkforceContent() {
  const canRegister = useHasAction("REGISTER_TEAM_MEMBERS");
  const { data: members = [], isLoading, error } = useListOrgTeamQuery();

  if (isLoading) return <p className="text-sm text-muted">Loading workforce…</p>;
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load team members")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Workforce"
        description="Team members in this organisation."
        action={
          canRegister ? (
            <Link href="/workforce/register" className="btn-primary">
              Register member
            </Link>
          ) : undefined
        }
      />

      <div className="data-table-wrap">
        {members.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No team members yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="font-medium">
                    {member.firstName} {member.lastName}
                  </td>
                  <td>{member.role.replaceAll("_", " ")}</td>
                  <td>{member.status}</td>
                  <td className="text-muted">{member.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function WorkforcePage() {
  return (
    <PagePermissionGuard page="WORKFORCE">
      <WorkforceContent />
    </PagePermissionGuard>
  );
}

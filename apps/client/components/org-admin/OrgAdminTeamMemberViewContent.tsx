"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MemberStatusPill } from "@/components/dashboard/MemberStatusPill";
import { useGetOrgTeamMemberQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

type OrgAdminTeamMemberViewContentProps = {
  memberId: string;
};

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Read-only team member profile for Org Admin.
export function OrgAdminTeamMemberViewContent({ memberId }: OrgAdminTeamMemberViewContentProps) {
  const { data: member, isLoading, error } = useGetOrgTeamMemberQuery(memberId);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading member…</p>;
  }

  if (error || !member) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load this team member.")}
      </p>
    );
  }

  const name = `${member.firstName} ${member.lastName}`;
  const canEdit = member.role !== "ORG_ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team member"
        description="Account details for this organisation user."
        action={
          <div className="flex gap-2">
            {canEdit ? (
              <Link href={`/org-admin/team/${member.id}/edit`} className="btn-secondary">
                Edit member
              </Link>
            ) : null}
            <Link href="/org-admin/team" className="btn-secondary">
              Back to team
            </Link>
          </div>
        }
      />

      <div className="dashboard-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="mt-1 text-sm text-muted">{member.email}</p>
            <p className="mt-1 text-sm text-muted">{formatRole(member.role)}</p>
          </div>
          <MemberStatusPill status={member.status} />
        </div>
      </div>

      <section className="dashboard-card p-6">
        <h3 className="text-lg font-semibold">Account</h3>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">First name</dt>
            <dd className="mt-1 text-sm font-medium">{member.firstName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Last name</dt>
            <dd className="mt-1 text-sm font-medium">{member.lastName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 text-sm font-medium">{member.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Role</dt>
            <dd className="mt-1 text-sm font-medium">{formatRole(member.role)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Registered</dt>
            <dd className="mt-1 text-sm font-medium">{formatDate(member.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Last login</dt>
            <dd className="mt-1 text-sm font-medium">{formatDate(member.lastLoginAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email verified</dt>
            <dd className="mt-1 text-sm font-medium">{formatDate(member.emailVerifiedAt)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

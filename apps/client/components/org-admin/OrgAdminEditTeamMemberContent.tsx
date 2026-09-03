"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import type { ConfigurableRoleId } from "@/lib/dashboard/content/org-admin-roles";
import { REGISTERABLE_ROLES } from "@/lib/dashboard/content/org-admin-team";
import { mockTeamMembers, type TeamMember, type TeamMemberStatus } from "@/lib/mocks/data";
import { inputClass, labelClass } from "@/lib/onboarding/form-styles";

type OrgAdminEditTeamMemberContentProps = {
  memberId: string;
};

const STATUS_OPTIONS: Array<{ value: TeamMemberStatus; label: string }> = [
  { value: "VERIFIED", label: "Verified — full access" },
  { value: "PENDING_APPROVAL", label: "Pending approval — awaiting review" },
  { value: "ONBOARDING", label: "Onboarding — in progress" },
  { value: "INVITED", label: "Invited" },
  { value: "MUST_CHANGE_PASSWORD", label: "Must change password" },
  { value: "SUSPENDED", label: "Suspended — no system access" },
];

function mapRoleToConfigurable(role: string): ConfigurableRoleId {
  if (role === "MANAGER" || role === "ROSTERING_EXPERT" || role === "EMPLOYEE") {
    return role;
  }
  if (role === "TEAM_LEADER") return "MANAGER";
  return "EMPLOYEE";
}

export function OrgAdminEditTeamMemberContent({ memberId }: OrgAdminEditTeamMemberContentProps) {
  const member: TeamMember =
    mockTeamMembers.find((item) => item.id === memberId) ?? mockTeamMembers[0];

  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [role, setRole] = useState<ConfigurableRoleId>(mapRoleToConfigurable(member.role));
  const [status, setStatus] = useState<TeamMemberStatus>(member.status);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit team member"
        description="Update account details, role, or access status. Deactivated members keep their data but cannot sign in."
        action={
          <Link
            href="/org-admin/team"
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-foreground"
          >
            Back to team
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="dashboard-card space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Full name</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Role</span>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as ConfigurableRoleId)}>
              {REGISTERABLE_ROLES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Access status</span>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as TeamMemberStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {status === "SUSPENDED" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This member will be unable to sign in. Their onboarding records and history are retained.
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Link
            href={`/org-admin/team/${member.id}/review`}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:border-primary/30"
          >
            View profile
          </Link>
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

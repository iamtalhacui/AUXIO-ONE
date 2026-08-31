"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useGetTeamMemberQuery, useUpdateTeamMemberMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { ConfigurableRoleCode, TeamMember } from "@/lib/api/types";
import { REGISTERABLE_ROLES } from "@/lib/dashboard/content/org-admin-team";
import { inputClass, labelClass } from "@/lib/onboarding/form-styles";

type OrgAdminEditTeamMemberContentProps = {
  memberId: string;
};

const STATUS_OPTIONS: Array<{ value: TeamMember["status"]; label: string }> = [
  { value: "VERIFIED", label: "Verified — full access" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUBMITTED", label: "Submitted — pending review" },
  { value: "PROCESSING", label: "Processing — onboarding in progress" },
  { value: "RESTRICTED", label: "Restricted" },
  { value: "DEACTIVATED", label: "Deactivated — no system access" },
];

export function OrgAdminEditTeamMemberContent({ memberId }: OrgAdminEditTeamMemberContentProps) {
  const router = useRouter();
  const { data, isLoading, error } = useGetTeamMemberQuery(memberId);
  const [updateMember, { isLoading: isSaving }] = useUpdateTeamMemberMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ConfigurableRoleCode>("EMPLOYEE");
  const [status, setStatus] = useState<TeamMember["status"]>("VERIFIED");
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setEmail(data.email);
    setRole((data.role?.code as ConfigurableRoleCode) ?? "EMPLOYEE");
    setStatus(data.status);
  }, [data]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaveError("");
    setSuccess("");

    try {
      await updateMember({
        memberId,
        body: { name, email, role, status },
      }).unwrap();
      setSuccess("Member updated.");
      setTimeout(() => router.push("/org-admin/team"), 900);
    } catch (err) {
      setSaveError(getErrorMessage(err, "Could not update member"));
    }
  }

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading member...</div>;
  }

  if (error || !data) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Could not load team member")}
      </div>
    );
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
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as ConfigurableRoleCode)}>
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
              onChange={(e) => setStatus(e.target.value as TeamMember["status"])}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {status === "DEACTIVATED" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This member will be unable to sign in. Their onboarding records and history are retained.
          </p>
        ) : null}

        {saveError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>
        ) : null}
        {success ? (
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{success}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Link
            href={`/org-admin/team/${memberId}/review`}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted hover:border-primary/30"
          >
            View profile
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

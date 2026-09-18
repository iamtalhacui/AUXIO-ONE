"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useGetOrgTeamMemberQuery, useUpdateTeamMemberMutation } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import type { UserStatus, WorkforceRole } from "@/lib/api/types";
import { REGISTERABLE_ROLES } from "@/lib/dashboard/content/org-admin-team";
import { inputClass, labelClass } from "@/lib/onboarding/form-styles";

type OrgAdminEditTeamMemberContentProps = {
  memberId: string;
};

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: "INVITED", label: "Invited — waiting to set password" },
  { value: "ACTIVE", label: "Active — can sign in" },
  { value: "SUSPENDED", label: "Suspended — cannot sign in" },
];

// Org Admin edit form for a workforce member (not the Org Admin account).
export function OrgAdminEditTeamMemberContent({ memberId }: OrgAdminEditTeamMemberContentProps) {
  const { toast } = useToast();
  const { data: member, isLoading, error } = useGetOrgTeamMemberQuery(memberId);
  const [updateMember, { isLoading: isSaving, error: saveError, reset }] =
    useUpdateTeamMemberMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkforceRole>("EMPLOYEE");
  const [status, setStatus] = useState<UserStatus>("INVITED");

  useEffect(() => {
    if (!member) return;
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setEmail(member.email);
    if (
      member.role === "MANAGER" ||
      member.role === "ROSTERING_EXPERT" ||
      member.role === "EMPLOYEE"
    ) {
      setRole(member.role);
    }
    setStatus(member.status);
  }, [member]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    reset();

    try {
      await updateMember({
        id: memberId,
        firstName,
        lastName,
        email,
        role,
        status,
      }).unwrap();
      toast({ variant: "success", title: "Member updated" });
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not save changes",
        description: getErrorMessage(err, "Could not save changes"),
      });
    }
  }

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

  if (member.role === "ORG_ADMIN") {
    return (
      <p className="text-sm text-muted">
        Organisation admin accounts cannot be edited from the team directory.
      </p>
    );
  }

  const errorMessage = saveError ? getErrorMessage(saveError, "Could not save changes") : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit team member"
        description="Update name, email, role, or access status."
        action={
          <Link href="/org-admin/team" className="btn-secondary">
            Back to team
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="dashboard-card space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>First name</span>
            <input
              className={inputClass}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Last name</span>
            <input
              className={inputClass}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
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
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value as WorkforceRole)}
            >
              {REGISTERABLE_ROLES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className={labelClass}>Access status</span>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
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
            This member will be unable to sign in.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Link href={`/org-admin/team/${member.id}/review`} className="btn-secondary">
            View profile
          </Link>
          <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-70">
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

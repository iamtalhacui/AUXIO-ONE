"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OnboardingStatusPill } from "@/components/onboarding/OnboardingStatusPill";
import { TeamMemberActionsMenu } from "@/components/org-admin/TeamMemberActionsMenu";
import { useListOrgTeamQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import type { OnboardingStatus, OrgTeamMember } from "@/lib/api/types";

type Tab = "all" | "pending" | "in_progress" | "verified";

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function onboardingDetail(member: OrgTeamMember): string {
  if (member.role === "ORG_ADMIN") return "—";
  switch (member.onboardingStatus) {
    case "PENDING_REVIEW":
      return "Submitted for review";
    case "IN_PROGRESS":
      return "In progress";
    case "VERIFIED":
      return "Verified";
    case "CHANGES_REQUIRED":
      return "Changes required";
    case "NOT_STARTED":
    default:
      return `Invited ${formatShortDate(member.createdAt)}`;
  }
}

function memberStatus(member: OrgTeamMember): OnboardingStatus | null {
  if (member.role === "ORG_ADMIN") return null;
  return member.onboardingStatus;
}

function filterMembers(members: OrgTeamMember[], tab: Tab, query: string) {
  const normalized = query.trim().toLowerCase();

  return members.filter((member) => {
    const status = memberStatus(member);
    if (tab === "pending" && status !== "PENDING_REVIEW") return false;
    if (tab === "in_progress" && status !== "IN_PROGRESS") return false;
    if (tab === "verified" && status !== "VERIFIED") return false;

    if (!normalized) return true;
    const name = `${member.firstName} ${member.lastName}`;
    const roleLabel = formatRole(member.role);
    return (
      name.toLowerCase().includes(normalized) ||
      member.email.toLowerCase().includes(normalized) ||
      roleLabel.toLowerCase().includes(normalized)
    );
  });
}

export function OrgAdminTeamContent() {
  const { data: members = [], isLoading, error } = useListOrgTeamQuery(undefined, {
    pollingInterval: LIVE_POLL_MS.lists,
  });
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    return {
      all: members.length,
      pending: members.filter((m) => memberStatus(m) === "PENDING_REVIEW").length,
      in_progress: members.filter((m) => memberStatus(m) === "IN_PROGRESS").length,
      verified: members.filter((m) => memberStatus(m) === "VERIFIED").length,
    };
  }, [members]);

  const filtered = useMemo(
    () => filterMembers(members, tab, query),
    [members, tab, query],
  );

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: "all", label: "All", count: counts.all },
    { id: "pending", label: "Pending review", count: counts.pending },
    { id: "in_progress", label: "In progress", count: counts.in_progress },
    { id: "verified", label: "Verified", count: counts.verified },
  ];

  if (isLoading) {
    return <p className="text-sm text-muted">Loading team…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load team. Enable the Workforce module first.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Organisation / Team
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">All members</h1>
          <p className="mt-1 text-sm text-muted">
            A clear view of every person moving through onboarding.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/org-admin/team/register" className="btn-primary">
            Invite member
          </Link>
        </div>
      </div>

      <div className="data-table-wrap">
        <div className="tab-bar pt-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`tab-item ${tab === item.id ? "tab-item-active" : ""}`}
            >
              {item.label}
              <span className="tab-count">{item.count}</span>
            </button>
          ))}
        </div>

        <div className="border-b border-border/50 px-5 py-4">
          <label className="search-input-wrap max-w-xl">
            <svg
              className="h-4 w-4 shrink-0 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Search by name, email or role"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium">No members found</p>
            <p className="mt-1 text-sm text-muted">
              {members.length === 0
                ? "Invite your first team member to get started."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Onboarding</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => {
                  const name = `${member.firstName} ${member.lastName}`;
                  const roleLabel = formatRole(member.role);
                  const status = memberStatus(member);
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(member.firstName, member.lastName)}
                          </span>
                          <span className="font-semibold">{name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{member.email}</td>
                      <td className="text-muted">{roleLabel}</td>
                      <td>
                        <OnboardingStatusPill status={status} memberId={member.id} />
                      </td>
                      <td className="text-sm text-muted">{onboardingDetail(member)}</td>
                      <td className="text-right">
                        <TeamMemberActionsMenu
                          memberId={member.id}
                          memberRoleCode={member.role}
                          onboardingStatus={status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/50 px-5 py-3 text-xs text-muted">
          <span>
            Showing {filtered.length} of {members.length} members
          </span>
        </div>
      </div>
    </div>
  );
}

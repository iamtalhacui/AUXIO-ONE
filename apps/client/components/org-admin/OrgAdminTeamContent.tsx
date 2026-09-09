"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  getMemberTabCategory,
  MemberStatusPill,
} from "@/components/dashboard/MemberStatusPill";
import { TeamMemberActionsMenu } from "@/components/org-admin/TeamMemberActionsMenu";
import { useListOrgTeamQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { OrgTeamMember } from "@/lib/api/types";

type Tab = "all" | "active" | "inactive";

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function filterMembers(members: OrgTeamMember[], tab: Tab, query: string) {
  const normalized = query.trim().toLowerCase();

  return members.filter((member) => {
    const category = getMemberTabCategory(member.status);
    if (tab === "active" && category !== "active") return false;
    if (tab === "inactive" && category !== "inactive") return false;

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
  const { data: members = [], isLoading, error } = useListOrgTeamQuery();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const active = members.filter((m) => getMemberTabCategory(m.status) === "active").length;
    const inactive = members.filter((m) => getMemberTabCategory(m.status) === "inactive").length;
    return { all: members.length, active, inactive };
  }, [members]);

  const filtered = useMemo(
    () => filterMembers(members, tab, query),
    [members, tab, query],
  );

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: "all", label: "All", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "inactive", label: "Inactive", count: counts.inactive },
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
    <div>
      <PageHeader
        title="Team directory"
        meta={`${members.length} registered`}
        action={
          <Link href="/org-admin/team/register" className="btn-primary">
            + Register member
          </Link>
        }
      />

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
          <label className="search-input-wrap max-w-md">
            <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Search by name, email, or role..."
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
                ? "Register your first team member to get started."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => {
                  const name = `${member.firstName} ${member.lastName}`;
                  const roleLabel = formatRole(member.role);
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
                      <td>
                        <p className="font-medium">{member.email}</p>
                      </td>
                      <td className="text-muted">{roleLabel}</td>
                      <td>
                        <MemberStatusPill status={member.status} />
                      </td>
                      <td className="text-right">
                        <TeamMemberActionsMenu
                          memberId={member.id}
                          memberRoleCode={member.role}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

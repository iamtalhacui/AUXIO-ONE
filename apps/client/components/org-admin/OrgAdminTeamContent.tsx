"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  getMemberTabCategory,
  MemberStatusPill,
} from "@/components/dashboard/MemberStatusPill";
import { TeamMemberActionsMenu } from "@/components/org-admin/TeamMemberActionsMenu";
import { useListTeamMembersQuery } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { TeamMember } from "@/lib/api/types";

type Tab = "all" | "active" | "inactive";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function filterMembers(members: TeamMember[], tab: Tab, query: string) {
  const normalized = query.trim().toLowerCase();

  return members.filter((member) => {
    const category = getMemberTabCategory(member.status);
    if (tab === "active" && category !== "active") return false;
    if (tab === "inactive" && category !== "inactive") return false;

    if (!normalized) return true;
    return (
      member.name.toLowerCase().includes(normalized) ||
      member.email.toLowerCase().includes(normalized) ||
      member.role?.name.toLowerCase().includes(normalized)
    );
  });
}

export function OrgAdminTeamContent() {
  const { data, isLoading, error } = useListTeamMembersQuery();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const members = data?.members ?? [];

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

      {isLoading ? (
        <div className="dashboard-card p-8 text-sm text-muted">Loading team...</div>
      ) : null}

      {error ? (
        <div className="dashboard-card p-8 text-sm text-red-700">
          {getErrorMessage(error, "Could not load team members")}
        </div>
      ) : null}

      {data ? (
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
                  {filtered.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(member.name)}
                          </span>
                          <span className="font-semibold">{member.name}</span>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium">{member.email}</p>
                        <p className="text-xs text-muted">{member.role?.name ?? "—"}</p>
                      </td>
                      <td className="text-muted">{member.role?.name ?? "—"}</td>
                      <td>
                        <MemberStatusPill status={member.status} />
                      </td>
                      <td className="text-right">
                        <TeamMemberActionsMenu
                          memberId={member.id}
                          memberRoleCode={member.role?.code}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

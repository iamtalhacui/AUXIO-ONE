"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OnboardingStatusPill } from "@/components/onboarding/OnboardingStatusPill";
import { useListAdminOnboardingQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import type { OnboardingStatus } from "@/lib/api/types";

type TabId = "pending" | "all";

const ROLE_LABEL: Record<string, string> = {
  ORG_ADMIN: "Org Admin",
  MANAGER: "Manager",
  ROSTERING_EXPERT: "Rostering Expert",
  EMPLOYEE: "Employee",
};

function formatWhen(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export function OnboardingReviewsContent() {
  const [tab, setTab] = useState<TabId>("pending");
  const [query, setQuery] = useState("");

  const { data = [], isLoading, error } = useListAdminOnboardingQuery(
    tab === "pending" ? { status: "PENDING_REVIEW" } : undefined,
    { pollingInterval: LIVE_POLL_MS.lists },
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => {
      const name = `${row.user.firstName} ${row.user.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        row.user.email.toLowerCase().includes(q) ||
        (ROLE_LABEL[row.user.role] ?? row.user.role).toLowerCase().includes(q)
      );
    });
  }, [data, query]);

  const pendingCount = useMemo(
    () =>
      tab === "pending"
        ? data.length
        : data.filter((r) => r.status === "PENDING_REVIEW").length,
    [data, tab],
  );

  if (isLoading) {
    return <p className="text-sm text-muted">Loading onboarding reviews…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load onboarding reviews.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding reviews"
        description="Approve or request changes on submitted member documents. You cannot review your own submission."
      />

      <div className="data-table-wrap">
        <div className="tab-bar pt-4">
          {(
            [
              { id: "pending" as const, label: "Pending review", count: pendingCount },
              { id: "all" as const, label: "All submissions", count: tab === "all" ? data.length : "—" },
            ] as const
          ).map((item) => (
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
            <span className="sr-only">Search submissions</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or role…"
              className="search-input"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">
            {tab === "pending"
              ? "No onboarding submissions awaiting review."
              : "No onboarding submissions found."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Documents</th>
                  <th>Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const name = `${row.user.firstName} ${row.user.lastName}`.trim();
                  const canReview = row.status === ("PENDING_REVIEW" as OnboardingStatus);
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="font-medium text-foreground">{name || "—"}</div>
                        <div className="text-xs text-muted">{row.user.email}</div>
                      </td>
                      <td className="text-sm">
                        {ROLE_LABEL[row.user.role] ?? row.user.role}
                      </td>
                      <td>
                        <OnboardingStatusPill
                          status={row.status}
                          clickableReview={false}
                        />
                      </td>
                      <td className="text-sm text-muted">{row.documentCount}</td>
                      <td className="text-sm text-muted">
                        {formatWhen(row.submittedAt)}
                      </td>
                      <td className="text-right">
                        {canReview ? (
                          <Link
                            href={`/onboarding-reviews/${row.user.id}`}
                            className="text-sm font-semibold text-primary hover:underline"
                          >
                            Review
                          </Link>
                        ) : (
                          <Link
                            href={`/onboarding-reviews/${row.user.id}`}
                            className="text-sm font-medium text-muted hover:underline"
                          >
                            View
                          </Link>
                        )}
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

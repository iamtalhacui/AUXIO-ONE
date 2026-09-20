"use client";

import Link from "next/link";
import type { OrgAdminOverview } from "@/lib/api/types";

type TeamNeedsAttentionCardProps = {
  attention: OrgAdminOverview["attention"];
};

function formatAge(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

const ROLE_LABEL: Record<string, string> = {
  MANAGER: "Manager",
  ROSTERING_EXPERT: "Rostering Expert",
  EMPLOYEE: "Employee",
};

type AttentionRow = {
  key: string;
  title: string;
  detail: string;
  age: string;
  href: string;
  cta: string;
};

export function TeamNeedsAttentionCard({ attention }: TeamNeedsAttentionCardProps) {
  const sections: Array<{
    title: string;
    count: number;
    rows: AttentionRow[];
  }> = [
    {
      title: "Onboarding reviews pending",
      count: attention.pendingOnboardingReviews.length,
      rows: attention.pendingOnboardingReviews.map((item) => ({
        key: `onboarding-${item.userId}`,
        title: item.name,
        detail: ROLE_LABEL[item.role] ?? item.role,
        age: formatAge(item.submittedAt),
        href: `/org-admin/team/${item.userId}/onboarding`,
        cta: "Review",
      })),
    },
    {
      title: "Shift approvals pending",
      count: attention.pendingShiftApprovals.length,
      rows: attention.pendingShiftApprovals.map((item) => ({
        key: `shift-${item.shiftId}`,
        title: item.participantName,
        detail: `Variance ${item.variance} min`,
        age: formatAge(item.endedAt),
        href: "/org-admin/shift-approvals",
        cta: "Review",
      })),
    },
    {
      title: "Stale team invites",
      count: attention.staleInvites.length,
      rows: attention.staleInvites.map((item) => ({
        key: `invite-${item.userId}`,
        title: item.name,
        detail: item.email,
        age: formatAge(item.invitedAt),
        href: `/org-admin/team/${item.userId}/review`,
        cta: "Open",
      })),
    },
  ].filter((section) => section.count > 0);

  const total =
    attention.pendingOnboardingReviews.length +
    attention.pendingShiftApprovals.length +
    attention.staleInvites.length;

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <p className="text-sm text-muted">
            {total === 0
              ? "Nothing waiting on you right now"
              : `${total} item${total === 1 ? "" : "s"} need your review`}
          </p>
        </div>
        {attention.pendingShiftApprovals.length > 0 ? (
          <Link href="/org-admin/shift-approvals" className="text-sm font-semibold text-primary">
            All approvals
          </Link>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted">You&apos;re caught up.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {sections.map((section) => (
            <div key={section.title} className="px-6 py-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold">{section.title}</h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {section.count}
                </span>
              </div>
              <ul className="space-y-3">
                {section.rows.map((row) => (
                  <li
                    key={row.key}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.title}</p>
                      <p className="truncate text-xs text-muted">
                        {row.detail} · {row.age}
                      </p>
                    </div>
                    <Link href={row.href} className="btn-secondary shrink-0 text-xs">
                      {row.cta}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

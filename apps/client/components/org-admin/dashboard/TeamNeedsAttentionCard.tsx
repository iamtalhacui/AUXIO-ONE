"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, UserRound } from "lucide-react";
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
  return days === 1 ? "1 day ago" : `${days}d ago`;
}

const ROLE_LABEL: Record<string, string> = {
  MANAGER: "Manager",
  ROSTERING_EXPERT: "Rostering Expert",
  EMPLOYEE: "Employee",
};

type AttentionRow = {
  key: string;
  icon: typeof UserRound;
  title: string;
  detail: string;
  age: string;
  href: string;
  cta: string;
};

export function TeamNeedsAttentionCard({ attention }: TeamNeedsAttentionCardProps) {
  const rows: AttentionRow[] = [
    ...attention.pendingOnboardingReviews.map((item) => ({
      key: `onboarding-${item.userId}`,
      icon: UserRound,
      title: item.name,
      detail: `Onboarding · ${ROLE_LABEL[item.role] ?? item.role}`,
      age: formatAge(item.submittedAt),
      href: `/org-admin/team/${item.userId}/onboarding`,
      cta: "Review",
    })),
    ...attention.pendingShiftApprovals.map((item) => ({
      key: `shift-${item.shiftId}`,
      icon: ClipboardList,
      title: item.participantName,
      detail: `Shift variance · ${item.variance} min`,
      age: formatAge(item.endedAt),
      href: "/org-admin/shift-approvals",
      cta: "Approve",
    })),
    ...attention.staleInvites.map((item) => ({
      key: `invite-${item.userId}`,
      icon: Clock3,
      title: item.name,
      detail: `Invite · ${item.email}`,
      age: formatAge(item.invitedAt),
      href: `/org-admin/team/${item.userId}/review`,
      cta: "Open",
    })),
  ];

  const total = rows.length;

  return (
    <section className="oad-attention">
      <header className="oad-attention-head">
        <div>
          <h2 className="oad-section-title">Needs attention</h2>
          <p className="oad-section-desc">
            {total === 0
              ? "Nothing waiting on you right now"
              : `${total} item${total === 1 ? "" : "s"} ready for your review`}
          </p>
        </div>
        {attention.pendingShiftApprovals.length > 0 ? (
          <Link href="/org-admin/shift-approvals" className="oad-text-link">
            All approvals
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </header>

      {total === 0 ? (
        <div className="oad-empty">
          <CheckCircle2 className="h-8 w-8 text-primary/70" aria-hidden />
          <p className="mt-2 text-sm font-medium text-foreground">You&apos;re caught up</p>
          <p className="mt-0.5 text-xs text-muted">Onboarding, shifts, and invites look healthy.</p>
        </div>
      ) : (
        <ul className="oad-attention-list">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <li key={row.key} className="oad-attention-row">
                <span className="oad-attention-icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                  <p className="truncate text-xs text-muted">
                    {row.detail} · {row.age}
                  </p>
                </div>
                <Link href={row.href} className="oad-row-cta">
                  {row.cta}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

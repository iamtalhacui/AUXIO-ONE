"use client";

import Link from "next/link";
import type { PlatformOverview } from "@/lib/api/types";

type NeedsAttentionCardProps = {
  attention: PlatformOverview["attention"];
};

function formatAge(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

type AttentionRow = {
  key: string;
  title: string;
  detail: string;
  age: string;
  href: string;
  cta: string;
};

export function NeedsAttentionCard({ attention }: NeedsAttentionCardProps) {
  const sections: Array<{
    title: string;
    count: number;
    rows: AttentionRow[];
  }> = [
    {
      title: "Org Admins to approve",
      count: attention.awaitingApproval.length,
      rows: attention.awaitingApproval.map((item) => ({
        key: `approve-${item.organisationId}`,
        title: item.organisationName,
        detail: `${item.adminName} · ${item.adminEmail}`,
        age: formatAge(item.createdAt),
        href: `/super-admin/organisations/${item.organisationId}`,
        cta: "Review",
      })),
    },
    {
      title: "Demo requests pending",
      count: attention.pendingDemos.length,
      rows: attention.pendingDemos.map((item) => ({
        key: `demo-${item.id}`,
        title: item.organisationName,
        detail: item.contactName,
        age: formatAge(item.createdAt),
        href: `/super-admin/demos/${item.id}`,
        cta: "Open",
      })),
    },
    {
      title: "Suspended tenants",
      count: attention.suspendedOrgs.length,
      rows: attention.suspendedOrgs.map((item) => ({
        key: `susp-${item.id}`,
        title: item.name,
        detail: "Tenant suspended",
        age: formatAge(item.createdAt),
        href: `/super-admin/organisations/${item.id}`,
        cta: "Open",
      })),
    },
    {
      title: "Stale invites",
      count: attention.staleInvites.length,
      rows: attention.staleInvites.map((item) => ({
        key: `invite-${item.id}`,
        title: item.name,
        detail: `${item.organisationName} · ${item.email}`,
        age: formatAge(item.invitedAt),
        href: `/super-admin/organisations/${item.organisationId}`,
        cta: "Open",
      })),
    },
  ].filter((section) => section.count > 0);

  const total =
    attention.awaitingApproval.length +
    attention.pendingDemos.length +
    attention.suspendedOrgs.length +
    attention.staleInvites.length;

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <p className="text-sm text-muted">
            {total === 0
              ? "Nothing waiting on you right now"
              : `${total} item${total === 1 ? "" : "s"} need a Super Admin decision`}
          </p>
        </div>
        {attention.pendingDemos.length > 0 ? (
          <Link href="/super-admin/demos" className="text-sm font-semibold text-primary">
            All demos
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

"use client";

import Link from "next/link";
import type { ManagerOverview } from "@/lib/api/types";

type ManagerNeedsAttentionCardProps = {
  attention: ManagerOverview["attention"];
  modules: ManagerOverview["modules"];
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

function money(value: number | null) {
  if (value == null) return null;
  return value.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

type AttentionRow = {
  key: string;
  title: string;
  detail: string;
  age?: string;
  href: string;
  cta: string;
};

export function ManagerNeedsAttentionCard({
  attention,
  modules,
}: ManagerNeedsAttentionCardProps) {
  const hasOps =
    modules.customersEnabled ||
    modules.crmEnabled ||
    modules.serviceDeliveryEnabled;

  if (!hasOps) {
    return (
      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <p className="text-sm text-muted">No operations modules enabled</p>
        </div>
        <p className="px-6 py-10 text-center text-sm text-muted">
          Ask your Org Admin to enable Service Delivery, Customers, or CRM in
          Module settings.
        </p>
      </div>
    );
  }

  const sections: Array<{
    title: string;
    count: number;
    rows: AttentionRow[];
  }> = [
    {
      title: "Shift approvals",
      count: attention.pendingShiftApprovals.length,
      rows: attention.pendingShiftApprovals.map((item) => ({
        key: `shift-${item.shiftId}`,
        title: item.participantName,
        detail: `Out-of-window finish · ${item.variance} min variance`,
        age: formatAge(item.endedAt),
        href: "/shift-approvals",
        cta: "Review",
      })),
    },
    {
      title: "Ready to activate",
      count: attention.readyToActivate.length,
      rows: attention.readyToActivate.map((item) => ({
        key: `activate-${item.customerId}`,
        title: item.displayName,
        detail: item.serviceLine || "No service line",
        href: `/customers/${item.customerId}`,
        cta: "Activate",
      })),
    },
    {
      title: "Incomplete onboarding",
      count: attention.incompleteOnboarding.length,
      rows: attention.incompleteOnboarding.map((item) => ({
        key: `docs-${item.customerId}`,
        title: item.displayName,
        detail: `${item.missingDocs} mandatory doc${item.missingDocs === 1 ? "" : "s"} missing`,
        href: `/customers/${item.customerId}`,
        cta: "Open",
      })),
    },
    {
      title: "Overdue CRM follow-ups",
      count: attention.overdueFollowUps.length,
      rows: attention.overdueFollowUps.map((item) => ({
        key: `followup-${item.opportunityId}`,
        title: item.title,
        detail: `${item.stage}${item.contactName ? ` · ${item.contactName}` : ""}`,
        age: formatAge(item.nextFollowUpAt),
        href: "/crm",
        cta: "Open CRM",
      })),
    },
    {
      title: "Accepted, not converted",
      count: attention.acceptedNotConverted.length,
      rows: attention.acceptedNotConverted.map((item) => ({
        key: `convert-${item.opportunityId}`,
        title: item.title,
        detail:
          [item.contactName, money(item.estimatedAnnualValue)]
            .filter(Boolean)
            .join(" · ") || "Ready to convert",
        href: "/crm",
        cta: "Convert",
      })),
    },
  ].filter((section) => section.count > 0);

  const total =
    attention.pendingShiftApprovals.length +
    attention.readyToActivate.length +
    attention.incompleteOnboarding.length +
    attention.overdueFollowUps.length +
    attention.acceptedNotConverted.length;

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
        {modules.serviceDeliveryEnabled &&
        attention.pendingShiftApprovals.length > 0 ? (
          <Link
            href="/shift-approvals"
            className="text-sm font-semibold text-primary"
          >
            All approvals
          </Link>
        ) : modules.crmEnabled && attention.overdueFollowUps.length > 0 ? (
          <Link href="/crm" className="text-sm font-semibold text-primary">
            Open CRM
          </Link>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted">
          You&apos;re caught up.
        </p>
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
                        {row.detail}
                        {row.age ? ` · ${row.age}` : ""}
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

"use client";

import Link from "next/link";
import type { RosterOverview } from "@/lib/api/types";
import { formatShortDate } from "@/lib/rostering/format";

type RosterNeedsAttentionCardProps = {
  attention: RosterOverview["attention"];
  scheduleEnabled: boolean;
};

type AttentionRow = {
  key: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

function shiftHref(shiftId: string) {
  return `/roster/matching?shift=${shiftId}`;
}

function shiftDetail(item: {
  date: string;
  startTime: string;
  serviceTitle: string;
  locationLabel: string;
  offeredWorkerName?: string | null;
}) {
  const bits = [
    `${formatShortDate(item.date)} · ${item.startTime}`,
    item.serviceTitle,
    item.locationLabel,
  ];
  if (item.offeredWorkerName) bits.push(`Offered to ${item.offeredWorkerName}`);
  return bits.filter(Boolean).join(" · ");
}

export function RosterNeedsAttentionCard({
  attention,
  scheduleEnabled,
}: RosterNeedsAttentionCardProps) {
  if (!scheduleEnabled) {
    return (
      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <p className="text-sm text-muted">Schedule module not enabled</p>
        </div>
        <p className="px-6 py-10 text-center text-sm text-muted">
          Ask your Org Admin to enable the Schedule module.
        </p>
      </div>
    );
  }

  const sections: Array<{ title: string; count: number; rows: AttentionRow[] }> = [
    {
      title: "Urgent — starts within 24h",
      count: attention.urgentOpen.length,
      rows: attention.urgentOpen.map((item) => ({
        key: `urgent-${item.shiftId}`,
        title: item.participantName,
        detail: shiftDetail(item),
        href: shiftHref(item.shiftId),
        cta: "Match now",
      })),
    },
    {
      title: "Drafts to publish/match",
      count: attention.drafts.length,
      rows: attention.drafts.map((item) => ({
        key: `draft-${item.shiftId}`,
        title: item.participantName,
        detail: shiftDetail(item),
        href: shiftHref(item.shiftId),
        cta: "Match",
      })),
    },
    {
      title: "Unfilled gaps",
      count: attention.unfilled.length,
      rows: attention.unfilled.map((item) => ({
        key: `unfilled-${item.shiftId}`,
        title: item.participantName,
        detail: shiftDetail(item),
        href: shiftHref(item.shiftId),
        cta: "Match",
      })),
    },
    {
      title: "Offers awaiting response",
      count: attention.offersPending.length,
      rows: attention.offersPending.map((item) => ({
        key: `offer-${item.shiftId}`,
        title: item.participantName,
        detail: shiftDetail(item),
        href: shiftHref(item.shiftId),
        cta: "Review",
      })),
    },
  ].filter((section) => section.count > 0);

  const total =
    attention.urgentOpen.length +
    attention.drafts.length +
    attention.unfilled.length +
    attention.offersPending.length;

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <p className="text-sm text-muted">
            {total === 0
              ? "Nothing waiting on you right now"
              : `${total} open item${total === 1 ? "" : "s"} in the next 7 days`}
          </p>
        </div>
        {total > 0 ? (
          <Link href="/roster/matching" className="text-sm font-semibold text-primary">
            All matching
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
                      <p className="truncate text-xs text-muted">{row.detail}</p>
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

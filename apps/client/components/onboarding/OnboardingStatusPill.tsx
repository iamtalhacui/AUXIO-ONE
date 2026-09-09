"use client";

import Link from "next/link";
import type { OnboardingStatus } from "@/lib/api/types";

const STATUS_UI: Record<
  OnboardingStatus,
  { label: string; className: string }
> = {
  PENDING_REVIEW: {
    label: "REVIEW",
    className: "bg-primary/10 text-primary",
  },
  IN_PROGRESS: {
    label: "In progress",
    className: "bg-[#f3e8d8] text-[#9a6b3f]",
  },
  VERIFIED: {
    label: "Verified",
    className: "bg-emerald-100 text-emerald-800",
  },
  CHANGES_REQUIRED: {
    label: "Changes required",
    className: "bg-red-100 text-red-700",
  },
  NOT_STARTED: {
    label: "Not started",
    className: "bg-[#eef1f3] text-muted",
  },
};

type OnboardingStatusPillProps = {
  status: OnboardingStatus | null;
  memberId?: string;
  clickableReview?: boolean;
};

export function OnboardingStatusPill({
  status,
  memberId,
  clickableReview = true,
}: OnboardingStatusPillProps) {
  if (!status) {
    return <span className="text-sm text-muted">—</span>;
  }

  const ui = STATUS_UI[status];
  const pill = (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${ui.className}`}>
      {ui.label}
    </span>
  );

  if (status === "PENDING_REVIEW" && clickableReview && memberId) {
    return (
      <Link
        href={`/org-admin/team/${memberId}/onboarding`}
        className="inline-flex transition hover:opacity-80"
        title="Review submission"
      >
        {pill}
      </Link>
    );
  }

  return pill;
}

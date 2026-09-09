import type { UserStatus } from "@/lib/api/types";
import type { TeamMemberStatus } from "@/lib/mocks/data";

type Status = UserStatus | TeamMemberStatus;

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "status-pill-active" },
  VERIFIED: { label: "Active", className: "status-pill-active" },
  INVITED: { label: "Invited", className: "status-pill-pending" },
  MUST_CHANGE_PASSWORD: { label: "Must change password", className: "status-pill-pending" },
  ONBOARDING: { label: "Onboarding", className: "status-pill-pending" },
  PENDING_APPROVAL: { label: "Pending review", className: "status-pill-review" },
  SUSPENDED: { label: "Suspended", className: "status-pill-inactive" },
};

export function MemberStatusPill({ status }: { status: Status }) {
  const config = STATUS_MAP[status] ?? { label: status, className: "status-pill-inactive" };
  return <span className={`status-pill ${config.className}`}>{config.label}</span>;
}

export function getMemberTabCategory(status: Status): "active" | "inactive" | "all" {
  if (status === "SUSPENDED") return "inactive";
  if (status === "ACTIVE" || status === "VERIFIED") return "active";
  return "all";
}

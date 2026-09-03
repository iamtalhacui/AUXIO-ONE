import type { TeamMember, TeamMemberStatus } from "@/lib/mocks/data";

const STATUS_MAP: Record<TeamMemberStatus, { label: string; className: string }> = {
  VERIFIED: { label: "Active", className: "status-pill-active" },
  INVITED: { label: "Invited", className: "status-pill-pending" },
  MUST_CHANGE_PASSWORD: { label: "Must change password", className: "status-pill-pending" },
  ONBOARDING: { label: "Onboarding", className: "status-pill-pending" },
  PENDING_APPROVAL: { label: "Pending review", className: "status-pill-review" },
  SUSPENDED: { label: "Suspended", className: "status-pill-inactive" },
};

export function MemberStatusPill({ status }: { status: TeamMember["status"] }) {
  const config = STATUS_MAP[status] ?? { label: status, className: "status-pill-inactive" };
  return <span className={`status-pill ${config.className}`}>{config.label}</span>;
}

export function getMemberTabCategory(status: TeamMember["status"]): "active" | "inactive" | "all" {
  if (status === "SUSPENDED") return "inactive";
  if (status === "VERIFIED") return "active";
  return "all";
}

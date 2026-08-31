import type { TeamMember } from "@/lib/api/types";

const STATUS_MAP: Record<
  TeamMember["status"],
  { label: string; className: string }
> = {
  VERIFIED: { label: "Active", className: "status-pill-active" },
  ACTIVE: { label: "Active", className: "status-pill-active" },
  INVITED: { label: "Invited", className: "status-pill-pending" },
  PROCESSING: { label: "Onboarding", className: "status-pill-pending" },
  SUBMITTED: { label: "Pending review", className: "status-pill-review" },
  RESTRICTED: { label: "Restricted", className: "status-pill-inactive" },
  DEACTIVATED: { label: "Inactive", className: "status-pill-inactive" },
};

export function MemberStatusPill({ status }: { status: TeamMember["status"] }) {
  const config = STATUS_MAP[status] ?? { label: status, className: "status-pill-inactive" };
  return <span className={`status-pill ${config.className}`}>{config.label}</span>;
}

export function getMemberTabCategory(status: TeamMember["status"]): "active" | "inactive" | "all" {
  if (status === "DEACTIVATED" || status === "RESTRICTED") return "inactive";
  if (status === "VERIFIED" || status === "ACTIVE") return "active";
  return "all";
}

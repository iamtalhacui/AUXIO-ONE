import type { IncidentStatus } from "@/lib/api/types";
import { INCIDENT_STATUS_LABELS } from "@/lib/incidents/constants";

const STYLES: Record<IncidentStatus, string> = {
  PENDING_REVIEW: "bg-amber-50 text-amber-800",
  UNDER_REVIEW: "bg-sky-50 text-sky-800",
  ACTION_REQUIRED: "bg-orange-50 text-orange-800",
  RESOLVED: "bg-emerald-50 text-emerald-800",
  CLOSED: "bg-slate-100 text-slate-700",
};

type Props = {
  status: IncidentStatus;
  size?: "sm" | "md";
};

export function IncidentStatusPill({ status, size = "md" }: Props) {
  const sizing = size === "sm" ? "!px-2 !py-0.5 !text-[11px]" : "";
  return (
    <span className={`status-pill ${STYLES[status]} ${sizing}`}>
      {INCIDENT_STATUS_LABELS[status]}
    </span>
  );
}

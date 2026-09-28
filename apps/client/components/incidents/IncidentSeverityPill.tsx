import type { IncidentSeverity } from "@/lib/incidents/types";
import { INCIDENT_SEVERITY_LABELS } from "@/lib/incidents/constants";

const STYLES: Record<IncidentSeverity, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-50 text-amber-800",
  HIGH: "bg-orange-50 text-orange-800",
  CRITICAL: "bg-red-50 text-red-700",
};

type Props = {
  severity: IncidentSeverity;
  size?: "sm" | "md";
};

export function IncidentSeverityPill({ severity, size = "md" }: Props) {
  const sizing = size === "sm" ? "!px-2 !py-0.5 !text-[11px]" : "";
  return (
    <span className={`status-pill ${STYLES[severity]} ${sizing}`}>
      {INCIDENT_SEVERITY_LABELS[severity]}
    </span>
  );
}

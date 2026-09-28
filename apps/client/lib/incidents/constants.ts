import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/lib/api/types";

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  PENDING_REVIEW: "Pending review",
  UNDER_REVIEW: "Under review",
  ACTION_REQUIRED: "Action required",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  FALL: "Fall",
  MEDICATION: "Medication",
  BEHAVIOUR: "Behaviour",
  INJURY: "Injury",
  PROPERTY: "Property damage",
  NEAR_MISS: "Near miss",
  OTHER: "Other",
};

export const INCIDENT_ACTION_STATUS_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
} as const;

export const INCIDENT_STATUSES = Object.keys(INCIDENT_STATUS_LABELS) as IncidentStatus[];
export const INCIDENT_SEVERITIES = Object.keys(INCIDENT_SEVERITY_LABELS) as IncidentSeverity[];
export const INCIDENT_TYPES = Object.keys(INCIDENT_TYPE_LABELS) as IncidentType[];

export const REPORT_STEPS = [
  { id: "safety", label: "Immediate safety", shortLabel: "Safety" },
  { id: "details", label: "Incident details", shortLabel: "Details" },
  { id: "description", label: "Description / actions", shortLabel: "Actions" },
  { id: "attachments", label: "Attachments", shortLabel: "Files" },
  { id: "review", label: "Review & confirm", shortLabel: "Review" },
] as const;

export type ReportStepId = (typeof REPORT_STEPS)[number]["id"];

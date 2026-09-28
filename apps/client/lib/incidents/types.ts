import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/lib/api/types";

export type {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  IncidentRecord as Incident,
  IncidentAttachmentMeta as IncidentAttachment,
  IncidentActionItem as IncidentFollowUp,
  IncidentReportability,
  IncidentHistoryEntry,
  CreateIncidentRequest as CreateIncidentInput,
} from "@/lib/api/types";

export type IncidentFilters = {
  query: string;
  status: IncidentStatus | "";
  severity: IncidentSeverity | "";
  type: IncidentType | "";
  dateFrom: string;
  dateTo: string;
};

import type { Incident, IncidentFilters } from "./types";
import {
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
} from "./constants";

export function formatIncidentDateTime(date: string, time: string) {
  try {
    const d = new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);
    if (Number.isNaN(d.getTime())) return `${date} · ${time}`;
    return d.toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return `${date} · ${time}`;
  }
}

export function formatIsoDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function statusLabel(status: Incident["status"]) {
  return INCIDENT_STATUS_LABELS[status];
}

export function severityLabel(severity: Incident["severity"]) {
  return INCIDENT_SEVERITY_LABELS[severity];
}

export function typeLabel(type: Incident["type"]) {
  return INCIDENT_TYPE_LABELS[type];
}

export function emptyFilters(): IncidentFilters {
  return {
    query: "",
    status: "",
    severity: "",
    type: "",
    dateFrom: "",
    dateTo: "",
  };
}

export function filterIncidents(incidents: Incident[], filters: IncidentFilters) {
  const q = filters.query.trim().toLowerCase();

  return incidents.filter((inc) => {
    if (filters.status && inc.status !== filters.status) return false;
    if (filters.severity && inc.severity !== filters.severity) return false;
    if (filters.type && inc.type !== filters.type) return false;
    if (filters.dateFrom && inc.date < filters.dateFrom) return false;
    if (filters.dateTo && inc.date > filters.dateTo) return false;

    if (!q) return true;
    const haystack = [
      inc.reference,
      inc.participantName ?? "",
      inc.reporterName,
      typeLabel(inc.type),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function summarizeIncidents(incidents: Incident[]) {
  return {
    total: incidents.length,
    pendingReview: incidents.filter((i) => i.status === "PENDING_REVIEW").length,
    underReview: incidents.filter((i) => i.status === "UNDER_REVIEW").length,
    actionRequired: incidents.filter((i) => i.status === "ACTION_REQUIRED").length,
    resolved: incidents.filter(
      (i) => i.status === "RESOLVED" || i.status === "CLOSED",
    ).length,
    highCritical: incidents.filter(
      (i) => i.severity === "HIGH" || i.severity === "CRITICAL",
    ).length,
  };
}

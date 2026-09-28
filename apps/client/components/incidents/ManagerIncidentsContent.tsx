"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { IncidentStatusPill } from "@/components/incidents/IncidentStatusPill";
import { IncidentSeverityPill } from "@/components/incidents/IncidentSeverityPill";
import { IncidentSummaryCards } from "@/components/incidents/IncidentSummaryCards";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
} from "@/lib/incidents/constants";
import {
  emptyFilters,
  formatIncidentDateTime,
  summarizeIncidents,
  typeLabel,
} from "@/lib/incidents/format";
import type { IncidentFilters } from "@/lib/incidents/types";
import { useListIncidentsQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { ListIncidentsParams } from "@/lib/api/types";

export function ManagerIncidentsContent() {
  const [filters, setFilters] = useState<IncidentFilters>(emptyFilters);

  const queryArgs = useMemo((): ListIncidentsParams => {
    const args: ListIncidentsParams = {};
    if (filters.status) args.status = filters.status;
    if (filters.severity) args.severity = filters.severity;
    if (filters.type) args.type = filters.type;
    if (filters.query.trim()) args.q = filters.query.trim();
    if (filters.dateFrom) args.dateFrom = filters.dateFrom;
    if (filters.dateTo) args.dateTo = filters.dateTo;
    return args;
  }, [filters]);

  const {
    data: incidents = [],
    isLoading,
    isError,
    error,
  } = useListIncidentsQuery(queryArgs);

  const { data: allForSummary = [] } = useListIncidentsQuery();

  const summary = useMemo(() => summarizeIncidents(allForSummary), [allForSummary]);

  const hasActiveFilters =
    Boolean(filters.query.trim()) ||
    Boolean(filters.status) ||
    Boolean(filters.severity) ||
    Boolean(filters.type) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);

  function patch(partial: Partial<IncidentFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Incidents" description="Loading incident register…" />
        <div className="dashboard-card h-28 animate-pulse" />
        <div className="dashboard-card h-64 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Incidents" />
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getErrorMessage(error, "Could not load incidents. Is the INCIDENTS module enabled?")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Incidents"
        description="Review reported incidents, track status, and coordinate follow-up actions."
      />

      <IncidentSummaryCards
        summary={summary}
        onSelectStatus={(status) => patch({ status })}
      />

      <section className="dashboard-card space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <label className="input-label" htmlFor="incident-search">
              Search
            </label>
            <input
              id="incident-search"
              className="input-field"
              value={filters.query}
              onChange={(e) => patch({ query: e.target.value })}
              placeholder="Search by reference, participant, or reporter…"
            />
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => setFilters(emptyFilters())}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FilterSelect
            id="filter-status"
            label="Status"
            value={filters.status}
            onChange={(v) => patch({ status: v as IncidentFilters["status"] })}
            options={INCIDENT_STATUSES.map((s) => ({
              value: s,
              label: INCIDENT_STATUS_LABELS[s],
            }))}
          />
          <FilterSelect
            id="filter-severity"
            label="Severity"
            value={filters.severity}
            onChange={(v) => patch({ severity: v as IncidentFilters["severity"] })}
            options={INCIDENT_SEVERITIES.map((s) => ({
              value: s,
              label: INCIDENT_SEVERITY_LABELS[s],
            }))}
          />
          <FilterSelect
            id="filter-type"
            label="Incident type"
            value={filters.type}
            onChange={(v) => patch({ type: v as IncidentFilters["type"] })}
            options={INCIDENT_TYPES.map((t) => ({
              value: t,
              label: INCIDENT_TYPE_LABELS[t],
            }))}
          />
          <div>
            <label className="input-label" htmlFor="filter-from">
              From date
            </label>
            <input
              id="filter-from"
              type="date"
              className="input-field"
              value={filters.dateFrom}
              onChange={(e) => patch({ dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="filter-to">
              To date
            </label>
            <input
              id="filter-to"
              type="date"
              className="input-field"
              value={filters.dateTo}
              onChange={(e) => patch({ dateTo: e.target.value })}
            />
          </div>
        </div>
      </section>

      <div className="data-table-wrap">
        {incidents.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-semibold text-foreground">No incidents match</p>
            <p className="mt-1 text-sm text-muted">
              {hasActiveFilters
                ? "Try clearing filters or adjusting your search."
                : "Incidents reported from shifts will appear here."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="btn-secondary mt-5"
                onClick={() => setFilters(emptyFilters())}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Participant</th>
                  <th>Reported by</th>
                  <th>Date / time</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <p className="font-medium tabular-nums">{inc.reference}</p>
                    </td>
                    <td className="text-muted">{typeLabel(inc.type)}</td>
                    <td>{inc.participantName || "—"}</td>
                    <td className="text-muted">{inc.reporterName}</td>
                    <td className="whitespace-nowrap text-muted">
                      {formatIncidentDateTime(inc.date, inc.approximateTime)}
                    </td>
                    <td>
                      <IncidentSeverityPill severity={inc.severity} size="sm" />
                    </td>
                    <td>
                      <IncidentStatusPill status={inc.status} size="sm" />
                    </td>
                    <td>
                      <Link
                        href={`/manager/incidents/${inc.id}`}
                        className="text-sm font-semibold text-primary"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="input-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

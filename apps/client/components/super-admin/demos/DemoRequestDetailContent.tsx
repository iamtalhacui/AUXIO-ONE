"use client";

import Link from "next/link";
import { DemoStatusBadge } from "@/components/dashboard/StatusBadge";
import {
  useGetDemoRequestQuery,
  useUpdateDemoRequestStatusMutation,
} from "@/lib/api/platformAuthApi";
import type { DemoRequestStatus } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUSES: DemoRequestStatus[] = ["PENDING", "CONTACTED", "COMPLETED"];

export function DemoRequestDetailContent({ requestId }: { requestId: string }) {
  const { data: request, isLoading, error } = useGetDemoRequestQuery(requestId);
  const [updateStatus, { isLoading: isUpdating, error: updateError }] =
    useUpdateDemoRequestStatusMutation();

  if (isLoading) {
    return <p className="text-sm text-muted">Loading demo request…</p>;
  }

  if (error || !request) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load this demo request.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/super-admin/demos"
        className="inline-flex text-sm font-medium text-muted hover:text-primary"
      >
        ← Back to demo requests
      </Link>

      <div className="dashboard-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Demo request
            </p>
            <h1 className="mt-2 text-2xl font-semibold">{request.organisationName}</h1>
            <p className="mt-1 text-sm text-muted">
              Submitted {formatDateTime(request.createdAt)}
            </p>
          </div>
          <DemoStatusBadge status={request.status} />
        </div>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Contact details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Contact person</dt>
            <dd className="mt-1 text-sm font-medium">{request.contactName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 text-sm font-medium">
              <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                {request.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Phone</dt>
            <dd className="mt-1 text-sm font-medium">{request.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Number of users</dt>
            <dd className="mt-1 text-sm font-medium">
              {request.numberOfUsers ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Preferred schedule</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Date</dt>
            <dd className="mt-1 text-sm font-medium">{formatDate(request.preferredDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Time slot</dt>
            <dd className="mt-1 text-sm font-medium">{request.preferredTime}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <dt className="text-xs uppercase tracking-wide text-muted">Message</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm font-medium">
            {request.message || "—"}
          </dd>
        </div>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Update status</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isUpdating || request.status === status}
              onClick={() => updateStatus({ id: request.id, status })}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                request.status === status
                  ? "bg-primary text-white"
                  : "border border-border bg-background hover:border-primary/40 disabled:opacity-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        {updateError ? (
          <p className="mt-3 text-sm text-red-600">
            {getErrorMessage(updateError, "Could not update status.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

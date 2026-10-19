"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DemoStatusBadge } from "@/components/dashboard/StatusBadge";
import { ConstrainedSelect } from "@/components/ui/ConstrainedSelect";
import {
  useGetDemoRequestQuery,
  useUpdateDemoRequestStatusMutation,
} from "@/lib/api/platformAuthApi";
import type { DemoRequestStatus } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";

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
  const { toast } = useToast();
  const { data: request, isLoading, error } = useGetDemoRequestQuery(requestId);
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateDemoRequestStatusMutation();
  const [selectedStatus, setSelectedStatus] = useState<DemoRequestStatus>("PENDING");

  useEffect(() => {
    if (request) setSelectedStatus(request.status);
  }, [request]);

  async function handleSaveStatus() {
    if (!request || selectedStatus === request.status || isUpdating) return;
    try {
      await updateStatus({ id: request.id, status: selectedStatus }).unwrap();
      toast({ variant: "success", title: `Status updated to ${selectedStatus}` });
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not update status",
        description: getErrorMessage(err, "Could not update status."),
      });
    }
  }

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

  const dirty = selectedStatus !== request.status;

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
        <p className="mt-1 text-sm text-muted">
          Move this request through PENDING → CONTACTED → COMPLETED.
        </p>

        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSaveStatus();
          }}
        >
          <label className="flex min-w-[12rem] flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Status
            </span>
            <ConstrainedSelect
              aria-label="Demo request status"
              value={selectedStatus}
              disabled={isUpdating}
              onChange={(next) => setSelectedStatus(next as DemoRequestStatus)}
              options={STATUSES.map((status) => ({
                value: status,
                label: status,
              }))}
            />
          </label>

          <button
            type="submit"
            disabled={!dirty || isUpdating}
            className="btn-primary disabled:opacity-50"
          >
            {isUpdating ? "Saving…" : "Save status"}
          </button>
        </form>
      </div>
    </div>
  );
}

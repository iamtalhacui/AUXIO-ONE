"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useApprovePlatformPaymentMutation,
  useGetPlatformPaymentQuery,
  useRejectPlatformPaymentMutation,
} from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import { useAppSelector } from "@/lib/store/hooks";
import type { PaymentStatus } from "@/lib/api/types";

function formatDay(value: string) {
  const iso = value.includes("T") ? value : `${value}T00:00:00`;
  return new Date(iso).toLocaleDateString("en-AU", {
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

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency || "AUD",
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)} ${currency}`;
  }
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING_APPROVAL: "Pending approval",
  PAID: "Paid",
  REJECTED: "Rejected",
};

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const styles =
    status === "PAID"
      ? "bg-emerald-100 text-emerald-800"
      : status === "REJECTED"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-900";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide ${styles}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SuperAdminPaymentDetailContent({
  paymentId,
}: {
  paymentId: string;
}) {
  const { toast } = useToast();
  const accessToken = useAppSelector((state) => state.platformAuth.accessToken);
  const { data: payment, isLoading, error } = useGetPlatformPaymentQuery(paymentId);
  const [approvePayment, { isLoading: isApproving }] =
    useApprovePlatformPaymentMutation();
  const [rejectPayment, { isLoading: isRejecting }] =
    useRejectPlatformPaymentMutation();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState("");

  const busy = isApproving || isRejecting;
  const isPending = payment?.status === "PENDING_APPROVAL";

  async function openProof() {
    if (!accessToken || !payment) return;
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";
    try {
      const res = await fetch(`${base}/platform/payments/${payment.id}/proof`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Could not open proof");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        const link = document.createElement("a");
        link.href = url;
        link.download = payment.proofFileName || "proof";
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not open proof",
        description: getErrorMessage(err, "Download failed"),
      });
    }
  }

  async function handleApprove() {
    if (!payment || busy) return;
    setActionError("");
    try {
      await approvePayment(payment.id).unwrap();
      toast({
        variant: "success",
        title: "Payment approved",
        description: "Subscription renewed and organisation reactivated if needed.",
      });
    } catch (err) {
      const message = getErrorMessage(err, "Could not approve payment");
      setActionError(message);
      toast({ variant: "error", title: "Approve failed", description: message });
    }
  }

  async function handleReject() {
    if (!payment || busy) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setActionError("Rejection reason is required.");
      return;
    }
    setActionError("");
    try {
      await rejectPayment({ id: payment.id, reason }).unwrap();
      toast({
        variant: "success",
        title: "Payment rejected",
        description: "Org Admin can submit a new payment.",
      });
      setShowRejectForm(false);
      setRejectReason("");
    } catch (err) {
      const message = getErrorMessage(err, "Could not reject payment");
      setActionError(message);
      toast({ variant: "error", title: "Reject failed", description: message });
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading payment…</p>;
  }

  if (error || !payment) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load this payment.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/super-admin/payments"
        className="inline-flex text-sm font-medium text-muted hover:text-primary"
      >
        ← Back to payments
      </Link>

      <div className="dashboard-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Payment review
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              {payment.organisation?.name ?? "Organisation"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Submitted {formatDateTime(payment.createdAt)}
            </p>
          </div>
          <PaymentBadge status={payment.status} />
        </div>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Payment details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Amount</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatMoney(payment.amountCents, payment.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Payment date</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatDay(payment.paymentDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Reference</dt>
            <dd className="mt-1 text-sm font-medium">{payment.reference}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Submitted by</dt>
            <dd className="mt-1 text-sm font-medium">
              {payment.submittedBy
                ? `${payment.submittedBy.name} (${payment.submittedBy.email})`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Proof file</dt>
            <dd className="mt-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => void openProof()}
                className="text-primary underline-offset-2 hover:underline"
              >
                {payment.proofFileName} — View
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Org status</dt>
            <dd className="mt-1 text-sm font-medium">{payment.organisationStatus}</dd>
          </div>
          {payment.notes ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs uppercase tracking-wide text-muted">Notes</dt>
              <dd className="mt-1 text-sm font-medium whitespace-pre-wrap">
                {payment.notes}
              </dd>
            </div>
          ) : null}
          {payment.rejectionReason ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs uppercase tracking-wide text-muted">
                Rejection reason
              </dt>
              <dd className="mt-1 text-sm font-medium text-red-700">
                {payment.rejectionReason}
              </dd>
            </div>
          ) : null}
          {payment.reviewedAt ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Reviewed</dt>
              <dd className="mt-1 text-sm font-medium">
                {formatDateTime(payment.reviewedAt)}
                {payment.reviewedByEmail ? ` · ${payment.reviewedByEmail}` : ""}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      {payment.subscription ? (
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Subscription</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Status</dt>
              <dd className="mt-1 text-sm font-medium">
                {payment.subscription.status.replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Billing cycle
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {payment.subscription.billingCycle}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Next renewal
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatDay(payment.subscription.nextRenewalDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Current period
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatDay(payment.subscription.currentPeriodStart)} –{" "}
                {formatDay(payment.subscription.currentPeriodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Grace period
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {payment.subscription.gracePeriodDays} day
                {payment.subscription.gracePeriodDays === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {isPending ? (
        <div className="dashboard-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Actions</h2>
          <p className="text-sm text-muted">
            Approve marks the payment as paid, renews the subscription from the
            current renewal date (or today if overdue), and reactivates the
            organisation if it was suspended for billing.
          </p>

          {actionError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary disabled:opacity-50"
              disabled={busy}
              onClick={() => void handleApprove()}
            >
              {isApproving ? "Approving…" : "Approve → Paid"}
            </button>
            <button
              type="button"
              className="btn-secondary disabled:opacity-50"
              disabled={busy}
              onClick={() => setShowRejectForm((v) => !v)}
            >
              Reject
            </button>
          </div>

          {showRejectForm ? (
            <div className="space-y-3 border-t border-border/70 pt-4">
              <label className="block">
                <span className="input-label">Rejection reason</span>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  required
                  className="input-field"
                  placeholder="Explain what was wrong so the Org Admin can correct it"
                />
              </label>
              <button
                type="button"
                className="btn-primary bg-red-700 hover:bg-red-800 disabled:opacity-50"
                disabled={busy}
                onClick={() => void handleReject()}
              >
                {isRejecting ? "Rejecting…" : "Confirm reject"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

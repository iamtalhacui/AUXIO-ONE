"use client";

import { FormEvent, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useGetOrgBillingSummaryQuery,
  useListOrgPaymentsQuery,
  useSubmitOrgPaymentMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import { useAppSelector } from "@/lib/store/hooks";
import type { PaymentStatus } from "@/lib/api/types";

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDay(value: string) {
  const iso = value.includes("T") ? value : `${value}T00:00:00`;
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
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

export function OrgAdminPaymentsContent() {
  const { toast } = useToast();
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useGetOrgBillingSummaryQuery();
  const {
    data: payments = [],
    isLoading: historyLoading,
    error: historyError,
  } = useListOrgPaymentsQuery();
  const [submitPayment, { isLoading: isSubmitting }] = useSubmitOrgPaymentMutation();

  const [paymentDate, setPaymentDate] = useState(todayIsoDate);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");

  const subscription = summary?.subscription;
  const latestStatus = summary?.latestPayment?.status ?? null;

  const amountLabel = useMemo(() => {
    if (!subscription) return "—";
    return formatMoney(subscription.amountCents, subscription.currency);
  }, [subscription]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    if (!summary?.canSubmitPayment) {
      setFormError(
        "Payment can only be submitted within 3 days of renewal, during grace, or when suspended.",
      );
      return;
    }
    if (!file) {
      setFormError("Upload a payment screenshot or PDF proof.");
      return;
    }
    if (!reference.trim()) {
      setFormError("Payment reference is required.");
      return;
    }

    try {
      await submitPayment({
        paymentDate,
        reference: reference.trim(),
        notes: notes.trim() || undefined,
        file,
      }).unwrap();
      toast({
        variant: "success",
        title: "Payment submitted",
        description: "Waiting for Super Admin approval.",
      });
      setReference("");
      setNotes("");
      setFile(null);
      setPaymentDate(todayIsoDate());
    } catch (err) {
      const message = getErrorMessage(err, "Could not submit payment");
      setFormError(message);
      toast({ variant: "error", title: "Submission failed", description: message });
    }
  }

  async function openProof(paymentId: string, fileName: string) {
    if (!accessToken) return;
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";
    try {
      const res = await fetch(`${base}/organisation/payments/${paymentId}/proof`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Could not open proof");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "proof";
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

  if (summaryLoading) {
    return <p className="text-sm text-muted">Loading subscription…</p>;
  }

  if (summaryError || !summary || !subscription) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(summaryError, "Could not load billing information.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View your subscription and submit offline payment proof for Super Admin review."
      />

      <section className="dashboard-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Current subscription</h2>
            <p className="mt-1 text-sm text-muted">
              Manual bank transfer / offline payment — no card gateway yet.
            </p>
          </div>
          {latestStatus ? <PaymentStatusBadge status={latestStatus} /> : null}
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Plan</dt>
            <dd className="mt-1 text-sm font-medium">{subscription.plan}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Billing cycle</dt>
            <dd className="mt-1 text-sm font-medium">
              {subscription.billingCycle === "YEARLY" ? "Yearly" : "Monthly"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Amount due</dt>
            <dd className="mt-1 text-sm font-medium">{amountLabel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Subscription status</dt>
            <dd className="mt-1 text-sm font-medium">
              {subscription.status.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Current period</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatDay(subscription.currentPeriodStart)} –{" "}
              {formatDay(subscription.currentPeriodEnd)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Next renewal / expiry</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatDay(subscription.nextRenewalDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Auto renewal</dt>
            <dd className="mt-1 text-sm font-medium">
              {subscription.autoRenewal ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Latest payment</dt>
            <dd className="mt-1 text-sm font-medium">
              {summary.latestPayment
                ? STATUS_LABEL[summary.latestPayment.status]
                : "No payments yet"}
            </dd>
          </div>
        </dl>

        {summary.latestPayment?.status === "REJECTED" &&
        summary.latestPayment.rejectionReason ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Last payment rejected: {summary.latestPayment.rejectionReason}
          </p>
        ) : null}

        {summary.reminder?.active && summary.reminder.message ? (
          <p
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              summary.reminder.kind === "SUSPENDED"
                ? "border-red-200 bg-red-50 text-red-800"
                : summary.reminder.kind === "GRACE_PERIOD"
                  ? "border-orange-200 bg-orange-50 text-orange-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {summary.reminder.message}
            {summary.reminder.graceEndsOn &&
            summary.reminder.kind === "GRACE_PERIOD"
              ? ` Grace ends ${formatDay(summary.reminder.graceEndsOn)}.`
              : null}
          </p>
        ) : null}

        {summary.hasPendingPayment ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            A payment is already awaiting Super Admin approval. You can submit another after it
            is reviewed.
          </p>
        ) : null}

        {!summary.canSubmitPayment &&
        !summary.hasPendingPayment &&
        subscription.status === "ACTIVE" ? (
          <p className="mt-4 rounded-lg border border-border bg-surface-muted/60 px-4 py-3 text-sm text-muted">
            Your subscription is paid and active
            {typeof summary.reminder?.daysUntilRenewal === "number"
              ? ` (${summary.reminder.daysUntilRenewal} day${
                  summary.reminder.daysUntilRenewal === 1 ? "" : "s"
                } until renewal on ${formatDay(subscription.nextRenewalDate)})`
              : ` until ${formatDay(subscription.nextRenewalDate)}`}
            . You can submit the next payment starting 3 days before the renewal date.
          </p>
        ) : null}
      </section>

      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Submit payment</h2>
        <p className="mt-1 text-sm text-muted">
          {summary.canSubmitPayment
            ? "Pay offline, then upload proof here. Status starts as pending approval."
            : summary.hasPendingPayment
              ? "Submission is locked while a payment awaits Super Admin approval."
              : "Submission opens 3 days before renewal, and stays open through grace or suspension."}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="input-label">Payment date</span>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="input-field"
                disabled={!summary.canSubmitPayment || isSubmitting}
              />
            </label>
            <label className="block">
              <span className="input-label">Amount</span>
              <input
                value={amountLabel}
                readOnly
                className="input-field bg-surface-subtle/60"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="input-label">Payment / reference details</span>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                maxLength={200}
                placeholder="Bank reference, receipt number, or transfer ID"
                className="input-field"
                disabled={!summary.canSubmitPayment || isSubmitting}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="input-label">
                Notes <span className="font-normal text-muted">(optional)</span>
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={3}
                className="input-field"
                disabled={!summary.canSubmitPayment || isSubmitting}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="input-label">Payment screenshot / proof</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="input-field file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
                disabled={!summary.canSubmitPayment || isSubmitting}
              />
              <span className="mt-1 block text-xs text-muted">
                PNG, JPEG, WebP, GIF, or PDF · max 8 MB
                {file ? ` · selected: ${file.name}` : ""}
              </span>
            </label>
          </div>

          {formError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!summary.canSubmitPayment || isSubmitting}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? "Submitting…" : "Submit payment for approval"}
          </button>
        </form>
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Payment history</h2>
          <p className="text-sm text-muted">All submissions for this organisation.</p>
        </div>

        {historyLoading ? (
          <p className="px-6 py-8 text-sm text-muted">Loading history…</p>
        ) : historyError ? (
          <p className="px-6 py-8 text-sm text-red-600">
            {getErrorMessage(historyError, "Could not load payment history.")}
          </p>
        ) : payments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted">No payments submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">Submitted</th>
                  <th className="px-6 py-3 font-semibold">Payment date</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Reference</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Proof</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border/60 align-top">
                    <td className="px-6 py-4 text-muted">
                      {formatDay(payment.createdAt.slice(0, 10))}
                      {payment.submittedBy ? (
                        <p className="text-xs">{payment.submittedBy.name}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">{formatDay(payment.paymentDate)}</td>
                    <td className="px-6 py-4 font-medium">
                      {formatMoney(payment.amountCents, payment.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{payment.reference}</p>
                      {payment.status === "REJECTED" && payment.rejectionReason ? (
                        <p className="mt-1 text-xs text-red-700">{payment.rejectionReason}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() => void openProof(payment.id, payment.proofFileName)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

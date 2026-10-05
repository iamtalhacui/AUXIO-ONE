"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useGetPlatformPaymentsOverviewQuery } from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { PaymentStatus, SubscriptionStatus } from "@/lib/api/types";

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

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING_APPROVAL: "Pending",
  PAID: "Paid",
  REJECTED: "Rejected",
};

const SUB_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  EXPIRING_SOON: "Expiring soon",
  GRACE_PERIOD: "Grace period",
  SUSPENDED: "Suspended",
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
      {PAYMENT_LABEL[status]}
    </span>
  );
}

function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  const styles =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : status === "EXPIRING_SOON"
        ? "bg-amber-100 text-amber-900"
        : status === "GRACE_PERIOD"
          ? "bg-orange-100 text-orange-900"
          : "bg-red-100 text-red-800";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide ${styles}`}
    >
      {SUB_LABEL[status]}
    </span>
  );
}

export function SuperAdminPaymentsContent() {
  const { data, isLoading, error } = useGetPlatformPaymentsOverviewQuery();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "ALL">(
    "ALL",
  );

  const organisations = data?.organisations ?? [];
  const pendingPayments = data?.pendingPayments ?? [];

  const filteredOrgs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return organisations.filter((org) => {
      if (
        statusFilter !== "ALL" &&
        org.subscription?.status !== statusFilter
      ) {
        return false;
      }
      if (!search) return true;
      return (
        org.name.toLowerCase().includes(search) ||
        org.plan.toLowerCase().includes(search)
      );
    });
  }, [organisations, query, statusFilter]);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading payments…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load payments.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Pending payment submissions</h2>
          <p className="text-sm text-muted">
            Review proof, then approve (renews subscription) or reject with a reason.
          </p>
        </div>

        {pendingPayments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted">No payments awaiting approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">Organisation</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Payment date</th>
                  <th className="px-6 py-3 font-semibold">Reference</th>
                  <th className="px-6 py-3 font-semibold">Submitted</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border/60">
                    <td className="px-6 py-4 font-medium">
                      {payment.organisation?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      {formatMoney(payment.amountCents, payment.currency)}
                    </td>
                    <td className="px-6 py-4">{formatDay(payment.paymentDate)}</td>
                    <td className="px-6 py-4">{payment.reference}</td>
                    <td className="px-6 py-4 text-muted">
                      {formatDay(payment.createdAt.slice(0, 10))}
                      {payment.submittedBy ? (
                        <p className="text-xs">{payment.submittedBy.name}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <PaymentBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/super-admin/payments/${payment.id}`}
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Organisations & subscriptions</h2>
          <p className="text-sm text-muted">
            Current subscription and payment status across the platform.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search organisation…"
              className="input-field max-w-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as SubscriptionStatus | "ALL")
              }
              className="input-field max-w-[12rem]"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING_SOON">Expiring soon</option>
              <option value="GRACE_PERIOD">Grace period</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {filteredOrgs.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted">No organisations match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">Organisation</th>
                  <th className="px-6 py-3 font-semibold">Plan</th>
                  <th className="px-6 py-3 font-semibold">Subscription</th>
                  <th className="px-6 py-3 font-semibold">Next renewal</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Pending</th>
                  <th className="px-6 py-3 font-semibold text-right">Org</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="border-t border-border/60">
                    <td className="px-6 py-4 font-medium">{org.name}</td>
                    <td className="px-6 py-4">{org.plan}</td>
                    <td className="px-6 py-4">
                      {org.subscription ? (
                        <SubscriptionBadge status={org.subscription.status} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {org.subscription
                        ? formatDay(org.subscription.nextRenewalDate)
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {org.subscription
                        ? formatMoney(
                            org.subscription.amountCents,
                            org.subscription.currency,
                          )
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {org.pendingPaymentCount > 0 ? (
                        <span className="font-semibold text-amber-800">
                          {org.pendingPaymentCount}
                        </span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/super-admin/organisations/${org.id}`}
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
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

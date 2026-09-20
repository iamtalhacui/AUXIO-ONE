"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { OrgStatusBadge } from "@/components/dashboard/StatusBadge";
import {
  useApproveOrgAdminMutation,
  useChangeOrgAdminEmailMutation,
  useGetOrganisationQuery,
  useRejectOrgAdminMutation,
} from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const APPROVAL_LABEL: Record<string, string> = {
  INVITED: "Invited — waiting for password",
  AWAITING_APPROVAL: "Awaiting Super Admin approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function OrganisationDetailContent({ organisationId }: { organisationId: string }) {
  const { toast } = useToast();
  const { data: org, isLoading, error } = useGetOrganisationQuery(organisationId);
  const [approve, approveState] = useApproveOrgAdminMutation();
  const [reject, rejectState] = useRejectOrgAdminMutation();
  const [changeEmail, changeState] = useChangeOrgAdminEmailMutation();
  const [actionError, setActionError] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading organisation…</p>;
  }

  if (error || !org) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load this organisation.")}
      </p>
    );
  }

  const approvalStatus = org.admin?.approvalStatus ?? null;
  const canApprove = approvalStatus === "AWAITING_APPROVAL";
  const busy = approveState.isLoading || rejectState.isLoading || changeState.isLoading;

  async function runAction(fn: () => Promise<unknown>, successMessage?: string) {
    setActionError("");
    try {
      await fn();
      if (successMessage) toast({ variant: "success", title: successMessage });
    } catch (err) {
      const message = getErrorMessage(err, "Action failed");
      setActionError(message);
      toast({ variant: "error", title: "Action failed", description: message });
    }
  }

  async function handleChangeEmail(event: FormEvent) {
    event.preventDefault();
    await runAction(async () => {
      await changeEmail({
        id: organisationId,
        adminEmail: email.trim(),
        adminFirstName: firstName.trim() || undefined,
        adminLastName: lastName.trim() || undefined,
      }).unwrap();
      setShowChangeEmail(false);
      setEmail("");
      setFirstName("");
      setLastName("");
    }, "Admin email updated and invite resent");
  }

  return (
    <div className="space-y-6">
      {showRejectDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="presentation"
          onClick={() => !busy && setShowRejectDialog(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-org-admin-title"
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="reject-org-admin-title" className="text-lg font-semibold">
              Reject Org Admin?
            </h2>
            <p className="mt-2 text-sm text-muted">
              This blocks the admin account and suspends the organisation until a correct
              admin is approved.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                className="btn-secondary disabled:opacity-50"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                onClick={() => {
                  void runAction(async () => {
                    await reject(organisationId).unwrap();
                    setShowRejectDialog(false);
                  }, "Org Admin rejected");
                }}
              >
                {rejectState.isLoading ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Link
        href="/super-admin/organisations"
        className="inline-flex text-sm font-medium text-muted hover:text-primary"
      >
        ← Back to organisations
      </Link>

      <div className="dashboard-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Tenant</p>
            <h1 className="mt-2 text-2xl font-semibold">{org.name}</h1>
            <p className="mt-1 text-sm text-muted">Contact: {org.email}</p>
          </div>
          <OrgStatusBadge status={org.status} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Registered {formatDate(org.createdAt)} · Plan {org.plan} · Time zone {org.timezone}
        </p>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Org Admin approval</h2>
        {org.admin ? (
          <>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
                <dd className="mt-1 text-sm font-medium">
                  {org.admin.firstName} {org.admin.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Login email</dt>
                <dd className="mt-1 text-sm font-medium">{org.admin.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Approval</dt>
                <dd className="mt-1 text-sm font-medium">
                  {APPROVAL_LABEL[org.admin.approvalStatus] ?? org.admin.approvalStatus}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Account status</dt>
                <dd className="mt-1 text-sm font-medium">{org.admin.status}</dd>
              </div>
            </dl>

            {actionError ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canApprove || busy}
                className="btn-primary disabled:opacity-50"
                onClick={() => runAction(() => approve(organisationId).unwrap(), "Org Admin approved")}
              >
                {approveState.isLoading ? "Approving…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={busy || approvalStatus === "REJECTED"}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                onClick={() => setShowRejectDialog(true)}
              >
                Reject
              </button>
              <button
                type="button"
                disabled={busy}
                className="btn-secondary disabled:opacity-50"
                onClick={() => {
                  setShowChangeEmail((open) => !open);
                  setEmail(org.admin?.email ?? "");
                  setFirstName(org.admin?.firstName ?? "");
                  setLastName(org.admin?.lastName ?? "");
                }}
              >
                Change admin email
              </button>
            </div>

            {showChangeEmail ? (
              <form className="mt-6 space-y-3 border-t border-border/60 pt-6" onSubmit={handleChangeEmail}>
                <p className="text-sm text-muted">
                  Updates the same Org Admin account, clears the password, sends a new invite, and
                  suspends the organisation until you approve again.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="input-label">Admin email</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                    />
                  </label>
                  <label className="block">
                    <span className="input-label">First name</span>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input-field"
                    />
                  </label>
                  <label className="block">
                    <span className="input-label">Last name</span>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input-field"
                    />
                  </label>
                </div>
                <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
                  {changeState.isLoading ? "Saving…" : "Save and resend invite"}
                </button>
              </form>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">No Org Admin linked to this organisation.</p>
        )}
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Organisation contact</h2>
        <p className="mt-1 text-sm text-muted">Not used for login.</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Contact email</dt>
            <dd className="mt-1 text-sm font-medium">{org.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Contact phone</dt>
            <dd className="mt-1 text-sm font-medium">{org.phone || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Granted modules</h2>
          <p className="text-sm text-muted">
            {org.modulesEnabled} enabled / {org.modulesGranted} granted
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Module</th>
                <th className="px-6 py-3 font-semibold">Code</th>
                <th className="px-6 py-3 font-semibold">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {org.modules.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted">
                    No modules granted.
                  </td>
                </tr>
              ) : (
                org.modules.map((module) => (
                  <tr key={module.code} className="border-t border-border/60">
                    <td className="px-6 py-4 font-medium">{module.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{module.code}</td>
                    <td className="px-6 py-4">{module.enabled ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

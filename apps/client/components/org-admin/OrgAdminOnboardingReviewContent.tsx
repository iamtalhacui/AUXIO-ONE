"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { IconBell, IconLock } from "@/components/dashboard/icons";
import {
  useGetAdminOnboardingQuery,
  useReviewOnboardingMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import type { OnboardingDocumentMeta } from "@/lib/api/types";
import { getOnboardingTemplate } from "@/lib/onboarding/templates";
import { useAppSelector } from "@/lib/store/hooks";

type OrgAdminOnboardingReviewContentProps = {
  memberId: string;
};

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatSubmittedAt(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.join(", ") || "—";
  const trimmed = String(value ?? "").trim();
  return trimmed || "—";
}

async function openDocumentBlob(args: {
  memberId: string;
  documentId: string;
  token: string | null;
  download?: boolean;
  fileName?: string;
}) {
  if (!args.token) throw new Error("Not authenticated");
  const res = await fetch(
    `${SERVER_URL}/organisation/onboarding/${args.memberId}/documents/${args.documentId}`,
    { headers: { Authorization: `Bearer ${args.token}` } },
  );
  if (!res.ok) throw new Error("Could not open document");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (args.download) {
    const a = document.createElement("a");
    a.href = url;
    a.download = args.fileName ?? "document";
    a.click();
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function OrgAdminOnboardingReviewContent({
  memberId,
}: OrgAdminOnboardingReviewContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const admin = useAppSelector((state) => state.orgAuth.user);
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const { data, isLoading, error } = useGetAdminOnboardingQuery(memberId);
  const [reviewOnboarding, { isLoading: isReviewing }] = useReviewOnboardingMutation();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [actionError, setActionError] = useState("");
  const [docError, setDocError] = useState("");

  const member = data?.user;
  const submission = data?.submission;
  const template = useMemo(
    () => getOnboardingTemplate(member?.role),
    [member?.role],
  );

  const personal = submission?.payload?.personal ?? {};
  const work = submission?.payload?.work ?? {};
  const documentsByKey = useMemo(() => {
    const map: Record<string, OnboardingDocumentMeta> = {};
    for (const doc of submission?.documents ?? []) {
      map[doc.fieldKey] = doc;
    }
    return map;
  }, [submission?.documents]);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading application…</p>;
  }

  if (error || !member) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load this onboarding submission.")}
      </p>
    );
  }

  const name = `${member.firstName} ${member.lastName}`;
  const status = member.onboardingStatus;
  const position =
    displayValue(work.jobTitle) !== "—"
      ? displayValue(work.jobTitle)
      : displayValue(work.serviceLines) !== "—"
        ? displayValue(work.serviceLines)
        : formatRole(member.role);

  const checklist = [
    "Identity document is legible",
    "Required checks are supplied",
    "Profile details are complete",
  ];

  const reviewerLabel = submission?.reviewedBy
    ? `${submission.reviewedBy.firstName} ${submission.reviewedBy.lastName}`
    : admin
      ? `${admin.firstName} ${admin.lastName}`
      : "Org Admin";

  async function handleApprove() {
    setActionError("");
    try {
      await reviewOnboarding({ userId: memberId, decision: "VERIFIED" }).unwrap();
      toast({ variant: "success", title: "Onboarding approved", description: `${name} is now verified.` });
      router.push("/org-admin/team");
    } catch (err) {
      const message = getErrorMessage(err, "Could not approve application.");
      setActionError(message);
      toast({ variant: "error", title: "Could not approve application", description: message });
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setRejectError("A reason is required to reject this application.");
      return;
    }
    setActionError("");
    try {
      await reviewOnboarding({
        userId: memberId,
        decision: "CHANGES_REQUIRED",
        note: rejectReason.trim(),
      }).unwrap();
      toast({ variant: "info", title: "Changes requested", description: `${name} was notified.` });
      router.push("/org-admin/team");
    } catch (err) {
      const message = getErrorMessage(err, "Could not reject application.");
      setRejectError(message);
      toast({ variant: "error", title: "Could not reject application", description: message });
    }
  }

  async function handleDocAction(doc: OnboardingDocumentMeta, download: boolean) {
    setDocError("");
    try {
      await openDocumentBlob({
        memberId,
        documentId: doc.id,
        token: accessToken,
        download,
        fileName: doc.fileName,
      });
    } catch (err) {
      setDocError(getErrorMessage(err, "Could not open document."));
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl pb-28">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Organisation / Team / Review
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Review application
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface text-muted"
            aria-label="Notifications"
            disabled
          >
            <IconBell className="h-4 w-4" />
          </button>
          <span className="rounded-full border border-border/70 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground/80">
            Org Admin
          </span>
        </div>
      </header>

      <Link
        href="/org-admin/team"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        ← Back to all members
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Application review
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">{name}</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {status === "PENDING_REVIEW"
                ? "Ready for review"
                : status === "VERIFIED"
                  ? "Verified"
                  : status === "CHANGES_REQUIRED"
                    ? "Changes required"
                    : "Onboarding"}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {member.email} · {position}
          </p>
        </div>
        <p className="shrink-0 text-sm text-muted">
          Submitted {formatSubmittedAt(submission?.submittedAt)}
        </p>
      </div>

      {actionError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}
      {docError ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {docError}
        </p>
      ) : null}

      {!submission ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No submitted onboarding payload is available yet for this member.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <section className="dashboard-card p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Submitted profile
            </p>
            <h3 className="mt-1 text-lg font-semibold">Personal information</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {template.personalFields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  value={displayValue(personal[field.key])}
                  fullWidth={field.fullWidth}
                />
              ))}
            </dl>
          </section>

          <section className="dashboard-card p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Submitted profile
            </p>
            <h3 className="mt-1 text-lg font-semibold">Work details</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {template.workFields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  value={displayValue(work[field.key])}
                  fullWidth={field.fullWidth}
                />
              ))}
            </dl>
          </section>

          <section className="dashboard-card p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Submitted files
            </p>
            <h3 className="mt-1 text-lg font-semibold">Documents</h3>
            <ul className="mt-5 space-y-3">
              {template.documentNeeds.map((need) => {
                const file = documentsByKey[need.key];
                return (
                  <li
                    key={need.key}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{need.title}</p>
                      {file ? (
                        <p className="mt-1 text-xs text-muted">
                          {file.fileName} · Uploaded {formatShortDate(file.uploadedAt)} ·{" "}
                          {formatFileSize(file.sizeBytes)}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted">
                          {need.required ? "Missing — required" : "Not supplied — optional"}
                        </p>
                      )}
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          file ? "bg-primary/10 text-primary" : "bg-[#eef1f3] text-muted"
                        }`}
                      >
                        {file ? "Ready to review" : need.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={!file}
                        onClick={() => file && void handleDocAction(file, false)}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted disabled:opacity-40"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        disabled={!file}
                        onClick={() => file && void handleDocAction(file, true)}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted disabled:opacity-40"
                      >
                        Download
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-primary/15 bg-[#e7f6f3] p-5">
            <h3 className="text-sm font-semibold">Review checklist</h3>
            <ul className="mt-4 space-y-3">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="dashboard-card p-5">
            <h3 className="text-sm font-semibold">Review trail</h3>
            <ol className="mt-4 space-y-4">
              <TrailItem
                title="Submission received"
                meta={`${formatShortDate(submission?.submittedAt)} · ${name}`}
              />
              <TrailItem
                title={`Assigned to ${reviewerLabel}`}
                meta={`${formatShortDate(submission?.submittedAt)} · Org Admin`}
              />
              {status === "VERIFIED" ? (
                <TrailItem
                  title="Approved and verified"
                  meta={`${formatShortDate(submission?.reviewedAt)} · ${reviewerLabel}`}
                />
              ) : null}
              {status === "CHANGES_REQUIRED" ? (
                <TrailItem
                  title="Changes requested"
                  meta={`${formatShortDate(submission?.reviewedAt)} · ${reviewerLabel}`}
                />
              ) : null}
            </ol>
          </div>

          <div className="rounded-2xl border border-border/70 bg-[#f8fafb] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <IconLock className="h-4 w-4 text-primary" />
              Secure review
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Only organisation admins can view this submission and attached documents.
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="text-sm text-muted">
            You’re reviewing <span className="font-semibold text-foreground">{name}</span>
            ’s application.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setRejectError("");
                setRejectOpen(true);
              }}
              disabled={status === "VERIFIED" || isReviewing}
              className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-40"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={status === "VERIFIED" || !submission || isReviewing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f4f4a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {isReviewing ? "Saving…" : "Approve and verify"}
            </button>
          </div>
        </div>
      </div>

      {rejectOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Reject application</h3>
            <p className="mt-1 text-sm text-muted">
              Tell {member.firstName} what needs to change. This note is shown on their changes
              required screen.
            </p>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
              placeholder="Describe the required updates…"
              className="input-field mt-4 resize-none"
            />
            {rejectError ? <p className="mt-2 text-sm text-red-600">{rejectError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={isReviewing}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Confirm reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium whitespace-pre-wrap">{value || "—"}</dd>
    </div>
  );
}

function TrailItem({ title, meta }: { title: string; meta: string }) {
  return (
    <li className="relative border-l border-border/80 pl-4">
      <span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-primary" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{meta}</p>
    </li>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DocumentViewButton } from "@/components/onboarding/DocumentViewButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useApproveTeamMemberMutation,
  useGetMemberOnboardingQuery,
} from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { SERVICE_LINE_OPTIONS } from "@/lib/onboarding/constants";
import { mergeOnboardingData } from "@/lib/onboarding/types";
import type { OnboardingDocuments, UploadedFileMeta } from "@/lib/onboarding/types";

type OrgAdminOnboardingReviewProps = {
  memberId: string;
};

function DetailGrid({ items }: { items: Array<{ label: string; value?: string | null }> }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium">{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

const DOC_LABELS: Record<keyof OnboardingDocuments, string> = {
  photoId: "Photo identification",
  qualifications: "Qualifications & certifications",
  wwcc: "Working with children check",
  policeCheck: "National police check",
  firstAid: "First aid certificate",
};

export function OrgAdminOnboardingReviewContent({ memberId }: OrgAdminOnboardingReviewProps) {
  const router = useRouter();
  const { data, isLoading, error } = useGetMemberOnboardingQuery(memberId);
  const [approveMember, { isLoading: isApproving }] = useApproveTeamMemberMutation();
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleApprove() {
    setActionError("");
    setSuccess("");
    try {
      await approveMember(memberId).unwrap();
      setSuccess("Member approved. They now have full dashboard access.");
      setTimeout(() => router.push("/org-admin/team"), 1200);
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not approve member"));
    }
  }

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading submission...</div>;
  }

  if (error || !data) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Could not load onboarding submission")}
      </div>
    );
  }

  const onboarding = mergeOnboardingData(data.profile?.data);
  const submittedAt = data.profile?.submittedAt
    ? new Date(data.profile.submittedAt).toLocaleString("en-AU")
    : null;

  const serviceLineLabels = onboarding.compliance.serviceLines
    .map((line) => SERVICE_LINE_OPTIONS.find((opt) => opt.value === line)?.label ?? line)
    .join(", ");

  const documentEntries = (
    Object.entries(onboarding.documents) as Array<[keyof OnboardingDocuments, UploadedFileMeta | null]>
  ).filter(([, file]) => file?.storedName);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review onboarding"
        description="Review the employee's submitted profile, documents, and declarations before approval."
        action={
          <div className="flex gap-2">
            <Link
              href={`/org-admin/team/${memberId}/edit`}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-foreground"
            >
              Edit member
            </Link>
            <Link
              href="/org-admin/team"
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-foreground"
            >
              Back to team
            </Link>
          </div>
        }
      />

      <div className="dashboard-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{data.member.name}</h2>
            <p className="mt-1 text-sm text-muted">{data.member.email}</p>
            <p className="mt-1 text-sm text-muted">
              {data.member.role?.name ?? "Team member"}
              {submittedAt ? ` · Submitted ${submittedAt}` : ""}
            </p>
          </div>
          <span
            className={`self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              data.member.status === "SUBMITTED"
                ? "bg-sky-100 text-sky-800"
                : "bg-surface-muted text-muted"
            }`}
          >
            {data.member.status}
          </span>
        </div>
      </div>

      {!data.profile ? (
        <div className="dashboard-card p-6 text-sm text-muted">
          This member has not started onboarding yet.
        </div>
      ) : (
        <>
          <section className="dashboard-card p-6">
            <h3 className="text-lg font-semibold">Contact details</h3>
            <div className="mt-5">
              <DetailGrid
                items={[
                  { label: "Phone", value: onboarding.contact.phone },
                  { label: "Address", value: onboarding.contact.addressLine1 },
                  { label: "Suburb", value: onboarding.contact.suburb },
                  { label: "State", value: onboarding.contact.state },
                  { label: "Postcode", value: onboarding.contact.postcode },
                  { label: "Emergency contact", value: onboarding.contact.emergencyName },
                  { label: "Emergency phone", value: onboarding.contact.emergencyPhone },
                  { label: "Relationship", value: onboarding.contact.emergencyRelation },
                ]}
              />
            </div>
          </section>

          <section className="dashboard-card p-6">
            <h3 className="text-lg font-semibold">Personal profile</h3>
            <div className="mt-5">
              <DetailGrid
                items={[
                  { label: "Preferred name", value: onboarding.personal.preferredName },
                  { label: "Date of birth", value: onboarding.personal.dateOfBirth },
                  { label: "Gender", value: onboarding.personal.gender },
                  { label: "Languages", value: onboarding.personal.languages },
                  { label: "Bio", value: onboarding.personal.bio },
                ]}
              />
            </div>
          </section>

          <section className="dashboard-card p-6">
            <h3 className="text-lg font-semibold">Documents</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {documentEntries.length === 0 ? (
                <p className="text-sm text-muted">No documents uploaded.</p>
              ) : (
                documentEntries.map(([key, file]) =>
                  file ? (
                    <div key={key} className="rounded-xl border border-border/70 bg-background/40 p-4">
                      <p className="text-sm font-semibold">{DOC_LABELS[key]}</p>
                      <div className="mt-3">
                        <DocumentViewButton file={file} />
                      </div>
                    </div>
                  ) : null,
                )
              )}
            </div>
          </section>

          <section className="dashboard-card p-6">
            <h3 className="text-lg font-semibold">Service & availability</h3>
            <div className="mt-5">
              <DetailGrid
                items={[
                  { label: "Service lines", value: serviceLineLabels },
                  { label: "Availability", value: onboarding.compliance.availabilityNotes },
                  { label: "Preferred hours", value: onboarding.compliance.preferredHours },
                  {
                    label: "Terms accepted",
                    value: onboarding.compliance.declarations.termsAccepted ? "Yes" : "No",
                  },
                  {
                    label: "Accuracy confirmed",
                    value: onboarding.compliance.declarations.accuracyConfirmed ? "Yes" : "No",
                  },
                  {
                    label: "Background check consent",
                    value: onboarding.compliance.declarations.consentBackgroundCheck ? "Yes" : "No",
                  },
                ]}
              />
            </div>
          </section>
        </>
      )}

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </p>
      ) : null}

      {data.member.status === "SUBMITTED" && data.profile ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isApproving}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
          >
            {isApproving ? "Approving..." : "Approve & verify employee"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

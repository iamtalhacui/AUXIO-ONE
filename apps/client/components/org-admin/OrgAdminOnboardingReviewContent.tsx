"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { mockTeamMembers, type TeamMember } from "@/lib/mocks/data";
import { SERVICE_LINE_OPTIONS } from "@/lib/onboarding/constants";
import type { OnboardingData, OnboardingDocuments, UploadedFileMeta } from "@/lib/onboarding/types";

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

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function mockOnboardingFor(member: TeamMember): OnboardingData {
  const firstName = member.name.split(" ")[0] ?? member.name;
  return {
    contact: {
      phone: "+61 400 000 000",
      addressLine1: "12 Example Street",
      addressLine2: "",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000",
      emergencyName: "Emergency Contact",
      emergencyPhone: "+61 400 000 001",
      emergencyRelation: "Sibling",
    },
    personal: {
      preferredName: firstName,
      dateOfBirth: "1992-05-14",
      gender: "Prefer not to say",
      languages: "English",
      bio: `${member.name} is a support worker ready for rostering.`,
    },
    documents: {
      photoId: {
        name: "photo-id.pdf",
        size: 120000,
        type: "application/pdf",
        uploadedAt: "2026-04-01T00:00:00.000Z",
        storedName: "photo-id.pdf",
      },
      qualifications: null,
      wwcc: {
        name: "wwcc.pdf",
        size: 98000,
        type: "application/pdf",
        uploadedAt: "2026-04-01T00:00:00.000Z",
        storedName: "wwcc.pdf",
      },
      policeCheck: null,
      firstAid: null,
    },
    compliance: {
      serviceLines: ["NDIS"],
      availabilityNotes: "Weekdays and alternate weekends",
      preferredHours: "Mon–Fri 8am–6pm",
      declarations: {
        termsAccepted: true,
        accuracyConfirmed: true,
        consentBackgroundCheck: true,
      },
    },
  };
}

export function OrgAdminOnboardingReviewContent({ memberId }: OrgAdminOnboardingReviewProps) {
  const member =
    mockTeamMembers.find((item) => item.id === memberId) ?? mockTeamMembers[0];
  const onboarding = mockOnboardingFor(member);
  const [reopenReason, setReopenReason] = useState("");

  const submittedAt = new Date(member.createdAt).toLocaleString("en-AU");
  const assignedLineLabel =
    SERVICE_LINE_OPTIONS.find((opt) => opt.value === member.serviceLine)?.label ??
    member.serviceLine ??
    "—";
  const selectedLineLabels = onboarding.compliance.serviceLines
    .map((line) => SERVICE_LINE_OPTIONS.find((opt) => opt.value === line)?.label ?? line)
    .join(", ");

  const documentEntries = (
    Object.entries(onboarding.documents) as Array<[keyof OnboardingDocuments, UploadedFileMeta | null]>
  ).filter(([, file]) => file?.storedName);

  const showActions = member.status === "PENDING_APPROVAL";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review onboarding"
        description="Review the employee's submitted profile, documents, and declarations before approval."
        action={
          <div className="flex gap-2">
            <Link
              href={`/org-admin/team/${member.id}/edit`}
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
            <h2 className="text-xl font-semibold">{member.name}</h2>
            <p className="mt-1 text-sm text-muted">{member.email}</p>
            <p className="mt-1 text-sm text-muted">
              {formatRole(member.role)}
              {` · Submitted ${submittedAt}`}
            </p>
          </div>
          <span
            className={`self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              member.status === "PENDING_APPROVAL"
                ? "bg-sky-100 text-sky-800"
                : "bg-surface-muted text-muted"
            }`}
          >
            {member.status}
          </span>
        </div>
      </div>

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
                  <p className="mt-3 text-sm text-muted">{file.name}</p>
                </div>
              ) : null,
            )
          )}
        </div>
      </section>

      <section className="dashboard-card p-6">
        <h3 className="text-lg font-semibold">Service lines & availability</h3>
        <div className="mt-5">
          <DetailGrid
            items={[
              { label: "Assigned service line (admin)", value: assignedLineLabel },
              { label: "Can work in (employee)", value: selectedLineLabels || "—" },
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

      {showActions ? (
        <div className="space-y-4">
          <div className="dashboard-card p-6">
            <h3 className="text-sm font-semibold">Reopen with reason</h3>
            <p className="mt-1 text-sm text-muted">
              Send the member back to fix specific items. A reason is mandatory.
            </p>
            <textarea
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              rows={3}
              placeholder="Explain what needs to be corrected..."
              className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              className="mt-4 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-foreground"
            >
              Reopen for corrections
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-light"
            >
              Approve & verify employee
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

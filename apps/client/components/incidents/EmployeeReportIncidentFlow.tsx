"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { IncidentSeverityPill } from "@/components/incidents/IncidentSeverityPill";
import { ConstrainedDateInput } from "@/components/ui/ConstrainedDateInput";
import { ConstrainedSelect } from "@/components/ui/ConstrainedSelect";
import { ConstrainedTimeInput } from "@/components/ui/ConstrainedTimeInput";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  REPORT_STEPS,
} from "@/lib/incidents/constants";
import { formatIncidentDateTime, typeLabel } from "@/lib/incidents/format";
import type { IncidentSeverity, IncidentType } from "@/lib/incidents/types";
import {
  useCreateIncidentMutation,
  useGetMyShiftQuery,
  useUploadIncidentAttachmentMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import { formatLongDate, formatShiftTime, todayIso } from "@/lib/rostering/format";

type PendingAttachment = {
  id: string;
  name: string;
  sizeLabel: string;
  file: File;
};

type FormState = {
  safetyConfirmed: boolean;
  date: string;
  approximateTime: string;
  location: string;
  peopleInvolved: string;
  participantName: string;
  type: IncidentType | "";
  severity: IncidentSeverity | "";
  description: string;
  immediateAction: string;
  nextSteps: string;
  attachments: PendingAttachment[];
  accuracyConfirmed: boolean;
};

function initialForm(shiftDefaults?: {
  date: string;
  location: string;
  participantName: string;
}): FormState {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  return {
    safetyConfirmed: false,
    date: shiftDefaults?.date ?? todayIso(),
    approximateTime: `${hh}:${mm}`,
    location: shiftDefaults?.location ?? "",
    peopleInvolved: "",
    participantName: shiftDefaults?.participantName ?? "",
    type: "",
    severity: "",
    description: "",
    immediateAction: "",
    nextSteps: "",
    attachments: [],
    accuracyConfirmed: false,
  };
}

type Props = {
  shiftId?: string;
};

export function EmployeeReportIncidentFlow({ shiftId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [createIncident] = useCreateIncidentMutation();
  const [uploadAttachment] = useUploadIncidentAttachmentMutation();

  const {
    data: shift,
    isLoading: shiftLoading,
    error: shiftError,
  } = useGetMyShiftQuery(shiftId!, { skip: !shiftId });

  const shiftReady = Boolean(shiftId) && Boolean(shift);
  const shiftEligible = shift?.status === "IN_PROGRESS";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialForm());
  const [seededFromShiftId, setSeededFromShiftId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState("");

  useEffect(() => {
    if (!shift || seededFromShiftId === shift.id) return;
    setSeededFromShiftId(shift.id);
    setForm(
      initialForm({
        date: shift.date,
        location: shift.locationLabel || "",
        participantName: shift.participantName || "",
      }),
    );
  }, [shift, seededFromShiftId]);

  const shiftLabel = useMemo(() => {
    if (!shift) return undefined;
    return `${formatLongDate(shift.date)} · ${formatShiftTime(shift.startTime, shift.endTime)} · ${shift.serviceTitle}`;
  }, [shift]);

  function patch(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setStepError("");
  }

  function validateStep(index: number): string | null {
    if (index === 0 && !form.safetyConfirmed) {
      return "Confirm immediate safety steps before continuing.";
    }
    if (index === 1) {
      if (!form.date) return "Enter the incident date.";
      if (!form.approximateTime) return "Enter an approximate time.";
      if (form.location.trim().length < 2) return "Enter the location.";
      if (!form.type) return "Select an incident type.";
      if (!form.severity) return "Select an initial severity.";
    }
    if (index === 2) {
      if (form.description.trim().length < 10) {
        return "Describe what happened (at least a short factual summary).";
      }
      if (form.immediateAction.trim().length < 3) {
        return "Record the immediate action taken.";
      }
    }
    if (index === 4 && !form.accuracyConfirmed) {
      return "Confirm the information is accurate before submitting.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setStep((s) => Math.min(s + 1, REPORT_STEPS.length - 1));
  }

  function goBack() {
    setStepError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: PendingAttachment[] = Array.from(files).map((file) => ({
      id: `att-${crypto.randomUUID()}`,
      name: file.name,
      sizeLabel: formatBytes(file.size),
      file,
    }));
    patch({ attachments: [...form.attachments, ...next] });
  }

  async function onSubmit() {
    const err = validateStep(4);
    if (err) {
      setStepError(err);
      return;
    }
    if (!form.type || !form.severity || !shift?.id) {
      setStepError("An active shift is required to submit an incident.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createIncident({
        shiftId: shift.id,
        date: form.date,
        approximateTime: form.approximateTime,
        location: form.location.trim(),
        peopleInvolved: form.peopleInvolved.trim(),
        participantName: form.participantName.trim() || undefined,
        participantId: shift.customerId ?? undefined,
        type: form.type,
        severity: form.severity,
        description: form.description.trim(),
        immediateAction: form.immediateAction.trim(),
        nextSteps: form.nextSteps.trim() || undefined,
      }).unwrap();

      for (const att of form.attachments) {
        await uploadAttachment({ incidentId: created.id, file: att.file }).unwrap();
      }

      toast({
        variant: "success",
        title: "Incident submitted",
        description: `${created.reference} is pending manager review.`,
      });
      router.push(shiftId ? `/my-shifts/${shiftId}` : "/my-shifts");
    } catch (submitErr) {
      setStepError(getErrorMessage(submitErr, "Could not submit incident."));
      toast({
        variant: "error",
        title: "Submit failed",
        description: getErrorMessage(submitErr, "Could not submit incident."),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!shiftId) {
    return (
      <div className="space-y-4">
        <Link
          href="/my-shifts"
          className="inline-flex text-sm font-semibold text-primary hover:underline"
        >
          ← Back to shifts
        </Link>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Open an in-progress shift and use <strong>Report incident</strong> to start this form.
        </p>
      </div>
    );
  }

  if (shiftLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Report incident" description="Loading shift…" />
        <div className="dashboard-card h-64 animate-pulse" />
      </div>
    );
  }

  if (shiftError || !shift) {
    return (
      <div className="space-y-4">
        <BackToShift shiftId={shiftId} />
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getErrorMessage(shiftError, "Could not load this shift for incident reporting.")}
        </p>
      </div>
    );
  }

  if (!shiftEligible) {
    return (
      <div className="space-y-4">
        <BackToShift shiftId={shiftId} />
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Incidents can only be reported while a shift is in progress. Start the shift first,
          then use Report incident.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {shiftId ? <BackToShift shiftId={shiftId} /> : null}

      <PageHeader
        title="Report incident"
        description={
          shiftReady
            ? `For ${shift!.participantName} · ${shiftLabel}`
            : "Complete each step, then confirm accuracy before submitting."
        }
      />

      <ReportStepper current={step} />

      <section className="dashboard-card space-y-5 p-5 sm:p-6">
        {step === 0 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              If anyone is at immediate risk, call emergency services first. Only continue once the
              situation is safe enough to document.
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
              <li>Ensure the participant and others are safe.</li>
              <li>Provide first aid if trained and appropriate.</li>
              <li>Notify your coordinator / on-call if required by policy.</li>
            </ul>
            <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-subtle px-4 py-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.safetyConfirmed}
                onChange={(e) => patch({ safetyConfirmed: e.target.checked })}
              />
              <span>
                I confirm immediate safety steps have been taken (or emergency services contacted
                where needed).
              </span>
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="input-label" htmlFor="inc-date">
                Date
              </label>
              <ConstrainedDateInput
                id="inc-date"
                aria-label="Incident date"
                value={form.date}
                onChange={(next) => patch({ date: next })}
              />
            </div>
            <div className="min-w-0">
              <label className="input-label" htmlFor="inc-time">
                Approximate time
              </label>
              <ConstrainedTimeInput
                id="inc-time"
                aria-label="Approximate time"
                value={form.approximateTime}
                onChange={(next) => patch({ approximateTime: next })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label" htmlFor="inc-location">
                Location
              </label>
              <input
                id="inc-location"
                className="input-field"
                value={form.location}
                onChange={(e) => patch({ location: e.target.value })}
                placeholder="Where did this occur?"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label" htmlFor="inc-people">
                People involved
              </label>
              <input
                id="inc-people"
                className="input-field"
                value={form.peopleInvolved}
                onChange={(e) => patch({ peopleInvolved: e.target.value })}
                placeholder="Workers, participant, family, others present"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label" htmlFor="inc-participant">
                Participant <span className="font-normal text-muted">(where applicable)</span>
              </label>
              <input
                id="inc-participant"
                className="input-field"
                value={form.participantName}
                onChange={(e) => patch({ participantName: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="inc-type">
                Incident type
              </label>
              <ConstrainedSelect
                id="inc-type"
                aria-label="Incident type"
                value={form.type}
                placeholder="Select type…"
                onChange={(next) => patch({ type: next as IncidentType | "" })}
                options={[
                  { value: "", label: "Select type…" },
                  ...INCIDENT_TYPES.map((t) => ({
                    value: t,
                    label: INCIDENT_TYPE_LABELS[t],
                  })),
                ]}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="inc-severity">
                Initial severity
              </label>
              <ConstrainedSelect
                id="inc-severity"
                aria-label="Initial severity"
                value={form.severity}
                placeholder="Select severity…"
                onChange={(next) => patch({ severity: next as IncidentSeverity | "" })}
                options={[
                  { value: "", label: "Select severity…" },
                  ...INCIDENT_SEVERITIES.map((s) => ({
                    value: s,
                    label: INCIDENT_SEVERITY_LABELS[s],
                  })),
                ]}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <label className="input-label" htmlFor="inc-desc">
                Description
              </label>
              <textarea
                id="inc-desc"
                className="input-field min-h-[120px]"
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Describe what happened factually — what you saw and when."
              />
            </div>
            <div>
              <label className="input-label" htmlFor="inc-immediate">
                Immediate action
              </label>
              <textarea
                id="inc-immediate"
                className="input-field min-h-[88px]"
                value={form.immediateAction}
                onChange={(e) => patch({ immediateAction: e.target.value })}
                placeholder="What you did in response."
              />
            </div>
            <div>
              <label className="input-label" htmlFor="inc-next">
                Next steps <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="inc-next"
                className="input-field min-h-[72px]"
                value={form.nextSteps}
                onChange={(e) => patch({ nextSteps: e.target.value })}
                placeholder="Recommended follow-up or who still needs notifying."
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Attach supporting files if available (PDF, JPG, PNG, or WEBP — max 8 MB each).
            </p>
            <input
              type="file"
              multiple
              className="input-field"
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {form.attachments.length === 0 ? (
              <p className="text-sm text-muted">No attachments yet — you can skip this step.</p>
            ) : (
              <ul className="divide-y divide-border/40 rounded-xl border border-border/60">
                {form.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{a.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted">{a.sizeLabel}</span>
                      <button
                        type="button"
                        className="font-semibold text-primary"
                        onClick={() =>
                          patch({
                            attachments: form.attachments.filter((x) => x.id !== a.id),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <ReviewRow label="When" value={formatIncidentDateTime(form.date, form.approximateTime)} />
            <ReviewRow label="Location" value={form.location || "—"} />
            <ReviewRow label="People involved" value={form.peopleInvolved || "—"} />
            <ReviewRow label="Participant" value={form.participantName || "—"} />
            <ReviewRow
              label="Type / severity"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  {form.type ? typeLabel(form.type) : "—"}
                  {form.severity ? <IncidentSeverityPill severity={form.severity} size="sm" /> : null}
                </span>
              }
            />
            <ReviewRow label="Description" value={form.description || "—"} />
            <ReviewRow label="Immediate action" value={form.immediateAction || "—"} />
            <ReviewRow label="Next steps" value={form.nextSteps || "—"} />
            <ReviewRow
              label="Attachments"
              value={
                form.attachments.length
                  ? form.attachments.map((a) => a.name).join(", ")
                  : "None"
              }
            />
            {shiftLabel ? <ReviewRow label="Shift" value={shiftLabel} /> : null}

            <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-subtle px-4 py-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.accuracyConfirmed}
                onChange={(e) => patch({ accuracyConfirmed: e.target.checked })}
              />
              <span>
                I confirm this information is accurate and complete to the best of my knowledge.
              </span>
            </label>
          </div>
        ) : null}

        {stepError ? (
          <p className="text-sm font-medium text-red-600">{stepError}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-border/50 pt-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            className="btn-secondary disabled:opacity-50"
            disabled={step === 0 || submitting}
            onClick={goBack}
          >
            Back
          </button>
          {step < REPORT_STEPS.length - 1 ? (
            <button type="button" className="btn-primary" onClick={goNext}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary disabled:opacity-50"
              disabled={submitting}
              onClick={() => void onSubmit()}
            >
              {submitting ? "Submitting…" : "Submit incident"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function ReportStepper({ current }: { current: number }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[560px] items-start justify-between gap-2">
        {REPORT_STEPS.map((s, index) => {
          const active = index === current;
          const complete = index < current;
          return (
            <div key={s.id} className="relative flex flex-1 flex-col items-center">
              {index < REPORT_STEPS.length - 1 ? (
                <div
                  className={`absolute left-[calc(50%+16px)] top-4 h-0.5 w-[calc(100%-32px)] ${
                    complete ? "bg-primary" : "bg-border"
                  }`}
                />
              ) : null}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : complete
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted"
                }`}
              >
                {index + 1}
              </div>
              <p
                className={`mt-2 text-center text-[11px] font-semibold ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                {s.shortLabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/40 pb-3 sm:grid-cols-[140px_1fr] sm:gap-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="text-sm text-foreground whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function BackToShift({ shiftId }: { shiftId: string }) {
  return (
    <Link
      href={`/my-shifts/${shiftId}`}
      className="inline-flex text-sm font-semibold text-primary hover:underline"
    >
      ← Back to shift
    </Link>
  );
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

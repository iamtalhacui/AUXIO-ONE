"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IconBell, IconLock } from "@/components/dashboard/icons";
import {
  OnboardingChangesRequiredView,
  type ChangesRequiredItem,
} from "@/components/onboarding/OnboardingChangesRequiredView";
import { OnboardingPendingReviewView } from "@/components/onboarding/OnboardingPendingReviewView";
import { OnboardingProgressBar } from "@/components/onboarding/OnboardingProgressBar";
import { TemplateFieldsForm } from "@/components/onboarding/TemplateFieldsForm";
import {
  useDeleteOnboardingDocumentMutation,
  useGetOnboardingMeQuery,
  useSaveOnboardingDraftMutation,
  useSubmitOnboardingMutation,
  useUploadOnboardingDocumentMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { OnboardingDocumentMeta, OnboardingStatus } from "@/lib/api/types";
import { getDashboardConfigForRole } from "@/lib/dashboard/config";
import {
  getOnboardingTemplate,
  ONBOARDING_STEP_META,
  type OnboardingStepId,
} from "@/lib/onboarding/templates";
import {
  emptyDocumentsFromNeeds,
  emptyValuesFromFields,
  isStepValid,
  type DashboardOnboardingState,
  type UploadedFileMeta,
} from "@/lib/onboarding/wizard-state";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { patchOrgUser } from "@/lib/store/orgAuthSlice";

type DashboardOnboardingFlowProps = {
  roleHint?: string;
};

type FlowPhase = "draft" | "pending_review" | "changes_required" | "view_submission";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function docMetaToUploaded(doc: OnboardingDocumentMeta): UploadedFileMeta {
  return {
    id: doc.id,
    name: doc.fileName,
    size: doc.sizeBytes,
    type: doc.mimeType,
    uploadedAt: doc.uploadedAt,
    storedName: doc.fileName,
  };
}

function documentsFromApi(
  docs: OnboardingDocumentMeta[] | undefined,
  needs: ReturnType<typeof getOnboardingTemplate>["documentNeeds"],
): DashboardOnboardingState["documents"] {
  const base = emptyDocumentsFromNeeds(needs);
  for (const doc of docs ?? []) {
    base[doc.fieldKey] = docMetaToUploaded(doc);
  }
  return base;
}

function changesItemsFromNote(reviewNote: string): ChangesRequiredItem[] {
  const detail = reviewNote.trim() || "Please update the requested details and resubmit.";
  return [
    {
      id: "personal",
      title: "Personal information",
      detail: "Review if mentioned in the admin note",
      status: "ok",
      stepIndex: 0,
    },
    {
      id: "work",
      title: "Work details",
      detail: "Review if mentioned in the admin note",
      status: "ok",
      stepIndex: 1,
    },
    {
      id: "documents",
      title: "Documents",
      detail,
      status: "needs_update",
      actionLabel: "Edit",
      stepIndex: 2,
    },
  ];
}

function phaseFromStatus(status: OnboardingStatus | undefined): FlowPhase {
  if (status === "PENDING_REVIEW") return "pending_review";
  if (status === "CHANGES_REQUIRED") return "changes_required";
  return "draft";
}

export function DashboardOnboardingFlow({ roleHint }: DashboardOnboardingFlowProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.orgAuth.user);
  const organisation = useAppSelector((state) => state.orgAuth.organisation);
  const template = useMemo(
    () => getOnboardingTemplate(roleHint ?? user?.role),
    [roleHint, user?.role],
  );

  const { data, isLoading, error: loadError } = useGetOnboardingMeQuery();
  const [saveDraft, { isLoading: isSaving }] = useSaveOnboardingDraftMutation();
  const [submitOnboarding, { isLoading: isSubmitting }] = useSubmitOnboardingMutation();
  const [uploadDocument, { isLoading: isUploading }] = useUploadOnboardingDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteOnboardingDocumentMutation();

  const [currentStep, setCurrentStep] = useState(0);
  const [saveMessage, setSaveMessage] = useState("Not saved yet");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<FlowPhase>("draft");
  const [hydrated, setHydrated] = useState(false);

  const [state, setState] = useState<DashboardOnboardingState>(() => ({
    personal: {
      ...emptyValuesFromFields(template.personalFields),
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      preferredName: user?.firstName ?? "",
    },
    work: emptyValuesFromFields(template.workFields),
    documents: emptyDocumentsFromNeeds(template.documentNeeds),
  }));

  useEffect(() => {
    if (!data) return;

    dispatch(patchOrgUser({ onboardingStatus: data.onboardingStatus }));

    const submission = data.submission;
    const personalPayload = submission?.payload?.personal ?? {};
    const workPayload = submission?.payload?.work ?? {};

    setState({
      personal: {
        ...emptyValuesFromFields(template.personalFields),
        ...personalPayload,
        firstName:
          String(personalPayload.firstName ?? "").trim() || user?.firstName || "",
        lastName: String(personalPayload.lastName ?? "").trim() || user?.lastName || "",
        email: String(personalPayload.email ?? "").trim() || user?.email || "",
        preferredName:
          String(personalPayload.preferredName ?? "").trim() ||
          user?.firstName ||
          "",
      },
      work: {
        ...emptyValuesFromFields(template.workFields),
        ...workPayload,
      },
      documents: documentsFromApi(submission?.documents, template.documentNeeds),
    });

    if (typeof submission?.currentStep === "number") {
      setCurrentStep(
        Math.min(
          Math.max(submission.currentStep, 0),
          ONBOARDING_STEP_META.length - 1,
        ),
      );
    }

    setHydrated(true);
  }, [
    data,
    dispatch,
    template.documentNeeds,
    template.personalFields,
    template.workFields,
    user?.email,
    user?.firstName,
    user?.lastName,
  ]);

  useEffect(() => {
    if (!data?.onboardingStatus) return;
    if (data.onboardingStatus === "VERIFIED") {
      const home = getDashboardConfigForRole(user?.role)?.basePath ?? "/";
      router.replace(home);
      return;
    }
    const next = phaseFromStatus(data.onboardingStatus);
    setPhase((prev) =>
      data.onboardingStatus === "CHANGES_REQUIRED" && prev === "draft"
        ? prev
        : next,
    );
  }, [data?.onboardingStatus, router, user?.role]);

  const stepId = ONBOARDING_STEP_META[currentStep]?.id ?? "personal";
  const firstName = user?.firstName ?? "there";
  const orgName = organisation?.name ?? "your organisation";
  const submittedAt = data?.submission?.submittedAt
    ? new Date(data.submission.submittedAt)
    : new Date();
  const returnedAt = data?.submission?.reviewedAt
    ? new Date(data.submission.reviewedAt)
    : new Date();
  const reviewNote = data?.submission?.reviewNote ?? "";

  async function persistDraft(nextStep = currentStep) {
    try {
      const result = await saveDraft({
        currentStep: nextStep,
        payload: {
          personal: state.personal,
          work: state.work,
        },
      }).unwrap();
      dispatch(patchOrgUser({ onboardingStatus: result.onboardingStatus }));
      setSaveMessage("Saved just now");
      setError("");
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Could not save draft."));
      return false;
    }
  }

  function validateCurrent(): boolean {
    const ok = isStepValid(
      stepId,
      state,
      template.personalFields,
      template.workFields,
      template.documentNeeds,
    );
    if (!ok) {
      setError("Complete all required fields before continuing.");
      return false;
    }
    setError("");
    return true;
  }

  async function handleContinue() {
    if (stepId === "submit") {
      if (!validateCurrent()) return;
      const saved = await persistDraft(currentStep);
      if (!saved) return;
      try {
        const result = await submitOnboarding().unwrap();
        dispatch(patchOrgUser({ onboardingStatus: result.onboardingStatus }));
        setPhase("pending_review");
        setSaveMessage("Submitted for review");
      } catch (err) {
        setError(getErrorMessage(err, "Could not submit onboarding."));
      }
      return;
    }

    if (stepId !== "review" && !validateCurrent()) return;

    const nextStep = Math.min(currentStep + 1, ONBOARDING_STEP_META.length - 1);
    const saved = await persistDraft(nextStep);
    if (!saved) return;
    setCurrentStep(nextStep);
  }

  function handleBack() {
    setError("");
    setCurrentStep((value) => Math.max(value - 1, 0));
  }

  async function handleUpload(key: string, file: File | null) {
    if (!file) return;
    setError("");
    try {
      const doc = await uploadDocument({ fieldKey: key, file }).unwrap();
      setState((prev) => ({
        ...prev,
        documents: { ...prev.documents, [key]: docMetaToUploaded(doc) },
      }));
      setSaveMessage("Document uploaded");
    } catch (err) {
      setError(getErrorMessage(err, "Could not upload document."));
    }
  }

  async function removeDocument(key: string) {
    const existing = state.documents[key];
    if (!existing?.id) {
      setState((prev) => ({
        ...prev,
        documents: { ...prev.documents, [key]: null },
      }));
      return;
    }
    setError("");
    try {
      await deleteDocument(existing.id).unwrap();
      setState((prev) => ({
        ...prev,
        documents: { ...prev.documents, [key]: null },
      }));
      setSaveMessage("Document removed");
    } catch (err) {
      setError(getErrorMessage(err, "Could not remove document."));
    }
  }

  if (isLoading || !hydrated) {
    return <p className="text-sm text-muted">Loading onboarding…</p>;
  }

  if (data?.onboardingStatus === "VERIFIED") {
    return <p className="text-sm text-muted">Redirecting to dashboard…</p>;
  }

  if (loadError) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(loadError, "Could not load onboarding.")}
      </p>
    );
  }

  if (phase === "pending_review" || phase === "view_submission") {
    if (phase === "view_submission") {
      return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <button
            type="button"
            onClick={() => setPhase("pending_review")}
            className="self-start text-sm font-semibold text-primary hover:underline"
          >
            ← Back to pending review
          </button>
          <div className="dashboard-card p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Read-only
            </p>
            <h2 className="mt-1 text-xl font-semibold">Submitted details</h2>
            <div className="mt-6">
              <ReviewPanels
                state={state}
                template={template}
                onJumpToStep={() => undefined}
                readOnly
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <OnboardingPendingReviewView
        firstName={firstName}
        orgName={orgName}
        roleLabel={template.roleLabel}
        submittedAt={submittedAt}
        state={state}
        template={template}
        onViewDetails={() => setPhase("view_submission")}
      />
    );
  }

  if (phase === "changes_required") {
    return (
      <OnboardingChangesRequiredView
        firstName={firstName}
        orgName={orgName}
        roleLabel={template.roleLabel}
        returnedAt={returnedAt}
        reviewerName="Org Admin"
        reviewNote={reviewNote}
        items={changesItemsFromNote(reviewNote)}
        onEditItem={(stepIndex) => {
          setCurrentStep(stepIndex);
          setPhase("draft");
        }}
        onResubmit={() => {
          setCurrentStep(0);
          setPhase("draft");
        }}
      />
    );
  }

  const busy = isSaving || isSubmitting || isUploading || isDeleting;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {orgName}
          <span className="mx-2 text-border">/</span>
          Your onboarding
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface text-muted"
            aria-label="Notifications"
            disabled
          >
            <IconBell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <span className="rounded-full border border-border/70 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground/80">
            {template.roleLabel}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Welcome to {orgName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Let’s get you ready, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            These details help {orgName} support you from day one. Only authorised reviewers can see
            your information.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
          {saveMessage}
        </span>
      </div>

      <OnboardingProgressBar currentStep={currentStep} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="dashboard-card p-6 sm:p-8">
          <StepBody
            stepId={stepId}
            template={template}
            state={state}
            onPersonalChange={(personal) => {
              setState((prev) => ({ ...prev, personal }));
            }}
            onWorkChange={(work) => {
              setState((prev) => ({ ...prev, work }));
            }}
            onUpload={handleUpload}
            onRemoveDocument={removeDocument}
            onJumpToStep={setCurrentStep}
          />

          {error ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || busy}
              className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={busy}
              className="rounded-xl bg-[#0f4f4a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary disabled:opacity-60"
            >
              {stepId === "submit"
                ? isSubmitting
                  ? "Submitting…"
                  : "Submit for review"
                : isSaving
                  ? "Saving…"
                  : "Save and continue"}
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-primary/15 bg-[#e7f6f3] p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-primary">
                <IconLock className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-foreground">Your privacy matters</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/75">
              Only authorised reviewers at {orgName} can see this. You can pause anytime and return
              later — nothing is final until you submit.
            </p>
          </div>

          <div className="dashboard-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Before you begin
            </p>
            <h2 className="mt-1 text-sm font-semibold">What you’ll need</h2>
            <ul className="mt-4 space-y-3">
              {template.documentNeeds.map((need) => {
                const uploaded = state.documents[need.key];
                return (
                  <li
                    key={need.key}
                    className="rounded-xl border border-border/60 bg-[#f8fafb] px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{need.title}</p>
                        <p className="mt-0.5 text-xs text-muted">{need.description}</p>
                        <p className="mt-1 text-[11px] font-medium text-primary">
                          {uploaded ? "Ready to review" : need.required ? "Required" : "Optional"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

type StepBodyProps = {
  stepId: OnboardingStepId;
  template: ReturnType<typeof getOnboardingTemplate>;
  state: DashboardOnboardingState;
  onPersonalChange: (values: DashboardOnboardingState["personal"]) => void;
  onWorkChange: (values: DashboardOnboardingState["work"]) => void;
  onUpload: (key: string, file: File | null) => void;
  onRemoveDocument: (key: string) => void;
  onJumpToStep: (index: number) => void;
};

function StepBody({
  stepId,
  template,
  state,
  onPersonalChange,
  onWorkChange,
  onUpload,
  onRemoveDocument,
  onJumpToStep,
}: StepBodyProps) {
  if (stepId === "personal") {
    return (
      <>
        <StepHeading
          index={1}
          title="Personal information"
          hint={template.personalHint}
        />
        <TemplateFieldsForm
          fields={template.personalFields}
          values={state.personal}
          onChange={onPersonalChange}
        />
      </>
    );
  }

  if (stepId === "work") {
    return (
      <>
        <StepHeading index={2} title="Work details" hint={template.workHint} />
        <TemplateFieldsForm
          fields={template.workFields}
          values={state.work}
          onChange={onWorkChange}
        />
      </>
    );
  }

  if (stepId === "documents") {
    return (
      <>
        <StepHeading
          index={3}
          title="Documents"
          hint="Upload clear scans or photos. PDF, JPG, or PNG work best."
        />
        <div className="space-y-3">
          {template.documentNeeds.map((need) => (
            <DocumentUploadRow
              key={need.key}
              title={need.title}
              description={need.description}
              required={need.required}
              file={state.documents[need.key]}
              onUpload={(file) => onUpload(need.key, file)}
              onRemove={() => onRemoveDocument(need.key)}
            />
          ))}
        </div>
      </>
    );
  }

  if (stepId === "review") {
    return (
      <>
        <StepHeading
          index={4}
          title="Review"
          hint="Check everything looks right before you submit for organisation review."
        />
        <ReviewPanels state={state} template={template} onJumpToStep={onJumpToStep} />
      </>
    );
  }

  return (
    <>
      <StepHeading
        index={5}
        title="Submit"
        hint="When you submit, your organisation admin will review your onboarding profile."
      />
      <div className="rounded-2xl border border-border/70 bg-[#f8fafb] p-5">
        <h3 className="text-base font-semibold">Ready to send for review?</h3>
        <p className="mt-2 text-sm text-muted">
          You’ll stay locked out of the rest of the workspace until an admin verifies your
          submission. You can still view this onboarding while it’s pending.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-foreground/80">
          <li>• Personal information complete</li>
          <li>• Work details complete</li>
          <li>• Required documents attached</li>
        </ul>
      </div>
    </>
  );
}

function StepHeading({
  index,
  title,
  hint,
}: {
  index: number;
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        Step {index} of 5
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </div>
  );
}

function DocumentUploadRow({
  title,
  description,
  required,
  file,
  onUpload,
  onRemove,
}: {
  title: string;
  description: string;
  required: boolean;
  file: UploadedFileMeta | null | undefined;
  onUpload: (file: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {title}
          {required ? <span className="text-red-500"> *</span> : null}
        </p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
        {file ? (
          <p className="mt-2 truncate text-xs font-medium text-primary">
            {file.name} · {formatFileSize(file.size)}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {file ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted hover:text-foreground"
          >
            Remove
          </button>
        ) : null}
        <label className="cursor-pointer rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15">
          {file ? "Replace" : "Upload"}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
            className="hidden"
            onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </div>
  );
}

function ReviewPanels({
  state,
  template,
  onJumpToStep,
  readOnly = false,
}: {
  state: DashboardOnboardingState;
  template: ReturnType<typeof getOnboardingTemplate>;
  onJumpToStep: (index: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      <ReviewBlock title="Personal information" onEdit={readOnly ? undefined : () => onJumpToStep(0)}>
        <FieldList fields={template.personalFields} values={state.personal} />
      </ReviewBlock>
      <ReviewBlock title="Work details" onEdit={readOnly ? undefined : () => onJumpToStep(1)}>
        <FieldList fields={template.workFields} values={state.work} />
      </ReviewBlock>
      <ReviewBlock title="Documents" onEdit={readOnly ? undefined : () => onJumpToStep(2)}>
        <ul className="space-y-2">
          {template.documentNeeds.map((need) => (
            <li key={need.key} className="flex justify-between gap-3 text-sm">
              <span className="text-muted">{need.title}</span>
              <span className="font-medium">
                {state.documents[need.key]?.name ?? (need.required ? "Missing" : "Not provided")}
              </span>
            </li>
          ))}
        </ul>
      </ReviewBlock>
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function FieldList({
  fields,
  values,
}: {
  fields: ReturnType<typeof getOnboardingTemplate>["personalFields"];
  values: DashboardOnboardingState["personal"];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const raw = values[field.key];
        const display = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "").trim();
        return (
          <div key={field.key} className={field.fullWidth ? "sm:col-span-2" : ""}>
            <dt className="text-xs text-muted">{field.label}</dt>
            <dd className="mt-0.5 text-sm font-medium whitespace-pre-wrap">
              {display || "—"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

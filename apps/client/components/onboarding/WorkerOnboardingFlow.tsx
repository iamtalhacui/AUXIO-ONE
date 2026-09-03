"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { ComplianceStep } from "@/components/onboarding/steps/ComplianceStep";
import { ContactDetailsStep } from "@/components/onboarding/steps/ContactDetailsStep";
import { DocumentsStep } from "@/components/onboarding/steps/DocumentsStep";
import { PersonalDetailsStep } from "@/components/onboarding/steps/PersonalDetailsStep";
import { ReviewStep } from "@/components/onboarding/steps/ReviewStep";
import {
  countCompletedSteps,
  isStepComplete,
  ONBOARDING_STEPS,
} from "@/lib/onboarding/constants";
import { mergeOnboardingData } from "@/lib/onboarding/types";
import type { OnboardingData, ServiceLine } from "@/lib/onboarding/types";
import { mockOrganisations, mockUser } from "@/lib/mocks/data";

const DEMO_SERVICE_LINE: ServiceLine = "NDIS";
const DEMO_ROLE_LABEL = "Support worker";

export function WorkerOnboardingFlow() {
  const router = useRouter();
  const org = mockOrganisations[0];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>(() => mergeOnboardingData(undefined));
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  function updateFormData(updater: (prev: OnboardingData) => OnboardingData) {
    setFormData((prev) => updater(prev));
  }

  function persist() {
    setSaveMessage("Progress saved");
    setTimeout(() => setSaveMessage(""), 2000);
  }

  function handleNext() {
    const step = ONBOARDING_STEPS[currentStep];
    if (!isStepComplete(step.id, formData) && step.id !== "review") {
      setError(`Complete all required fields in ${step.label} before continuing.`);
      return;
    }

    setCurrentStep(Math.min(currentStep + 1, ONBOARDING_STEPS.length - 1));
    setError("");
    persist();
  }

  function handleBack() {
    setCurrentStep(Math.max(currentStep - 1, 0));
    setError("");
    persist();
  }

  function handleSubmit() {
    setError("");
    const allComplete = ONBOARDING_STEPS.slice(0, 4).every((step) =>
      isStepComplete(step.id, formData),
    );

    if (!allComplete) {
      setError("Complete all required sections before submitting.");
      return;
    }

    router.push("/pending-approval");
  }

  const completedCount = countCompletedSteps(formData);
  const totalActivities = ONBOARDING_STEPS.length - 1;

  return (
    <OnboardingShell organisationName={org.tradingName ?? org.legalName}>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          People & Compliance
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Employee onboarding</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Complete your profile, upload compliance documents, and submit for organisation approval
              before accessing your dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="dashboard-card h-fit p-5 lg:sticky lg:top-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Your journey</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              In progress
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              AC
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{mockUser.name}</p>
              <p className="text-xs text-muted">
                {completedCount}/{totalActivities} activities complete
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-1">
            {ONBOARDING_STEPS.map((step, index) => {
              const complete = isStepComplete(step.id, formData);
              const active = index === currentStep;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-muted hover:bg-background hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        complete
                          ? "bg-primary text-white"
                          : active
                            ? "border border-primary text-primary"
                            : "border border-border"
                      }`}
                    >
                      {complete ? "✓" : index + 1}
                    </span>
                    {step.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="space-y-6">
          <div className="dashboard-card p-6 lg:p-8">
            <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Employee journey
                </p>
                <h2 className="mt-1 text-2xl font-semibold">{mockUser.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {DEMO_ROLE_LABEL} · Onboarding
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums text-primary">
                  {completedCount}/{totalActivities}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Complete</p>
              </div>
            </div>

            <div className="mt-8">
              <OnboardingStepper currentStep={currentStep} data={formData} />
            </div>
          </div>

          {currentStep === 0 ? (
            <ContactDetailsStep
              value={formData.contact}
              onChange={(contact) => updateFormData((prev) => ({ ...prev, contact }))}
            />
          ) : null}

          {currentStep === 1 ? (
            <PersonalDetailsStep
              value={formData.personal}
              onChange={(personal) => updateFormData((prev) => ({ ...prev, personal }))}
            />
          ) : null}

          {currentStep === 2 ? (
            <DocumentsStep
              value={formData.documents}
              onChange={(documents) => updateFormData((prev) => ({ ...prev, documents }))}
            />
          ) : null}

          {currentStep === 3 ? (
            <ComplianceStep
              value={formData.compliance}
              assignedServiceLine={DEMO_SERVICE_LINE}
              onChange={(compliance) => updateFormData((prev) => ({ ...prev, compliance }))}
            />
          ) : null}

          {currentStep === 4 ? (
            <ReviewStep
              data={formData}
              assignedServiceLine={DEMO_SERVICE_LINE}
              onEditStep={setCurrentStep}
            />
          ) : null}

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {saveMessage ? (
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              {saveMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-foreground disabled:opacity-50"
            >
              Back
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={persist}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-primary/30 disabled:opacity-50"
              >
                Save draft
              </button>

              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
                >
                  Submit for approval
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

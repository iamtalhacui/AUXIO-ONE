"use client";

import { isStepComplete, ONBOARDING_STEPS, SERVICE_LINE_OPTIONS } from "@/lib/onboarding/constants";
import { sectionClass } from "@/lib/onboarding/form-styles";
import type { OnboardingData } from "@/lib/onboarding/types";

type ReviewStepProps = {
  data: OnboardingData;
  onEditStep: (index: number) => void;
};

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/50 py-3 last:border-0 sm:flex-row sm:justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export function ReviewStep({ data, onEditStep }: ReviewStepProps) {
  const allComplete = ONBOARDING_STEPS.slice(0, 4).every((step) =>
    isStepComplete(step.id, data),
  );

  const serviceLineLabels = data.compliance.serviceLines
    .map((line) => SERVICE_LINE_OPTIONS.find((opt) => opt.value === line)?.label ?? line)
    .join(", ");

  return (
    <div className={sectionClass}>
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Review & submit</h2>
        <p className="mt-1 text-sm text-muted">
          Check everything is correct before sending your profile to your organisation for approval.
        </p>
      </div>

      {!allComplete ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Complete all required sections before submitting. Use Edit on any incomplete section below.
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          All required sections are complete. Submit when you are ready for review.
        </div>
      )}

      <div className="space-y-6">
        {ONBOARDING_STEPS.slice(0, 4).map((step) => {
          const complete = isStepComplete(step.id, data);
          return (
            <div key={step.id} className="rounded-2xl border border-border/70 bg-background/40 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      complete ? "bg-primary/10 text-primary" : "bg-surface-muted text-muted"
                    }`}
                  >
                    {complete ? "✓" : "!"}
                  </div>
                  <h3 className="font-semibold">{step.label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onEditStep(step.index)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Edit
                </button>
              </div>

              {step.id === "contact" ? (
                <div>
                  <ReviewRow label="Phone" value={data.contact.phone} />
                  <ReviewRow
                    label="Address"
                    value={`${data.contact.addressLine1}, ${data.contact.suburb} ${data.contact.state} ${data.contact.postcode}`}
                  />
                  <ReviewRow label="Emergency contact" value={data.contact.emergencyName} />
                </div>
              ) : null}

              {step.id === "personal" ? (
                <div>
                  <ReviewRow label="Date of birth" value={data.personal.dateOfBirth} />
                  <ReviewRow label="Gender" value={data.personal.gender} />
                  <ReviewRow label="Languages" value={data.personal.languages} />
                </div>
              ) : null}

              {step.id === "documents" ? (
                <div>
                  <ReviewRow label="Photo ID" value={data.documents.photoId?.name} />
                  <ReviewRow label="Qualifications" value={data.documents.qualifications?.name} />
                  <ReviewRow label="WWCC" value={data.documents.wwcc?.name} />
                </div>
              ) : null}

              {step.id === "compliance" ? (
                <div>
                  <ReviewRow label="Service lines" value={serviceLineLabels} />
                  <ReviewRow label="Availability" value={data.compliance.availabilityNotes} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

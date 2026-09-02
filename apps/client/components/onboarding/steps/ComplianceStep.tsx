"use client";

import type { ChangeEvent } from "react";
import { SERVICE_LINE_OPTIONS } from "@/lib/onboarding/constants";
import { inputClass, labelClass, sectionClass } from "@/lib/onboarding/form-styles";
import type { OnboardingCompliance, ServiceLine } from "@/lib/onboarding/types";

type ComplianceStepProps = {
  value: OnboardingCompliance;
  assignedServiceLine?: ServiceLine | null;
  onChange: (value: OnboardingCompliance) => void;
};

export function ComplianceStep({ value, onChange, assignedServiceLine }: ComplianceStepProps) {
  const assignedLabel = assignedServiceLine
    ? SERVICE_LINE_OPTIONS.find((opt) => opt.value === assignedServiceLine)?.label ??
      assignedServiceLine
    : null;

  function toggleServiceLine(line: ServiceLine) {
    const exists = value.serviceLines.includes(line);
    onChange({
      ...value,
      serviceLines: exists
        ? value.serviceLines.filter((item) => item !== line)
        : [...value.serviceLines, line],
    });
  }

  function updateDeclaration(key: keyof OnboardingCompliance["declarations"]) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...value,
        declarations: {
          ...value.declarations,
          [key]: event.target.checked,
        },
      });
    };
  }

  return (
    <div className={sectionClass}>
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Service lines & availability</h2>
        <p className="mt-1 text-sm text-muted">
          Select the service lines you are qualified and available to work in. Your organisation
          assigns your primary line{assignedLabel ? ` (${assignedLabel})` : ""}; include it in
          your selections.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <p className={labelClass}>Service lines you can work in</p>
          <p className="mb-4 text-sm text-muted">
            Choose every line where you can deliver support. You may select more than one.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {SERVICE_LINE_OPTIONS.map((option) => {
              const selected = value.serviceLines.includes(option.value);
              const isAssigned = assignedServiceLine === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleServiceLine(option.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-primary bg-primary/5 shadow-[inset_0_0_0_1px_rgba(17,94,89,0.15)]"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{option.label}</p>
                    {isAssigned ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Assigned
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className={labelClass}>Availability</span>
            <textarea
              value={value.availabilityNotes}
              onChange={(event) =>
                onChange({ ...value, availabilityNotes: event.target.value })
              }
              rows={3}
              placeholder="Days and times you are generally available for shifts"
              className={`${inputClass} resize-none`}
            />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}>Preferred hours (optional)</span>
            <input
              type="text"
              value={value.preferredHours}
              onChange={(event) =>
                onChange({ ...value, preferredHours: event.target.value })
              }
              placeholder="e.g. 20–30 hours per week, no overnight shifts"
              className={inputClass}
            />
          </label>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
          <h3 className="font-semibold">Declarations</h3>
          <p className="mt-1 text-sm text-muted">
            Required before your profile can be submitted for approval.
          </p>

          <div className="mt-5 space-y-4">
            {[
              {
                key: "termsAccepted" as const,
                label: "I agree to the organisation's terms of engagement and privacy policy.",
              },
              {
                key: "accuracyConfirmed" as const,
                label: "I confirm all information and documents provided are accurate and current.",
              },
              {
                key: "consentBackgroundCheck" as const,
                label: "I consent to verification of my credentials and compliance documents.",
              },
            ].map((item) => (
              <label key={item.key} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={value.declarations[item.key]}
                  onChange={updateDeclaration(item.key)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm leading-relaxed">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

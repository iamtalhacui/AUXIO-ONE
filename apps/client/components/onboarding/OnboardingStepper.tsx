"use client";

import { ONBOARDING_STEPS, isStepComplete } from "@/lib/onboarding/constants";
import type { OnboardingData } from "@/lib/onboarding/types";

type OnboardingStepperProps = {
  currentStep: number;
  data: OnboardingData;
};

export function OnboardingStepper({ currentStep, data }: OnboardingStepperProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[640px] items-start justify-between gap-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const complete = isStepComplete(step.id, data);
          const active = index === currentStep;
          const past = index < currentStep || complete;

          return (
            <div key={step.id} className="relative flex flex-1 flex-col items-center">
              {index < ONBOARDING_STEPS.length - 1 ? (
                <div
                  className={`absolute left-[calc(50%+18px)] top-5 h-0.5 w-[calc(100%-36px)] ${
                    past && index < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              ) : null}

              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(17,94,89,0.12)]"
                    : complete
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted"
                }`}
              >
                {complete && !active ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              <p
                className={`mt-3 text-center text-xs font-semibold ${
                  active ? "text-primary" : complete ? "text-foreground" : "text-muted"
                }`}
              >
                {step.shortLabel}
              </p>
              {active ? (
                <div className="mt-1 h-0.5 w-8 rounded-full bg-primary" />
              ) : (
                <div className="mt-1 h-0.5 w-8" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

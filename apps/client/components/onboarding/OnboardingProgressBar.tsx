"use client";

import { ONBOARDING_STEP_META } from "@/lib/onboarding/templates";

type OnboardingProgressBarProps = {
  currentStep: number;
};

export function OnboardingProgressBar({ currentStep }: OnboardingProgressBarProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[720px] items-center">
        {ONBOARDING_STEP_META.map((step, index) => {
          const active = index === currentStep;
          const complete = index < currentStep;
          const isLast = index === ONBOARDING_STEP_META.length - 1;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex min-w-0 flex-col items-start gap-2">
                <div className="flex w-full items-center">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      active
                        ? "bg-primary text-white"
                        : complete
                          ? "bg-primary/15 text-primary"
                          : "bg-[#e8ecef] text-muted"
                    }`}
                  >
                    {complete ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                  {!isLast ? (
                    <span
                      className={`mx-3 h-px flex-1 ${complete ? "bg-primary/40" : "bg-border"}`}
                      aria-hidden
                    />
                  ) : null}
                </div>
                <p
                  className={`pr-4 text-xs font-semibold leading-snug ${
                    active ? "text-primary" : complete ? "text-foreground" : "text-muted"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

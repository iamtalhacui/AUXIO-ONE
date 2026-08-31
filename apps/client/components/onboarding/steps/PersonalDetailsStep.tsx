"use client";

import type { ChangeEvent } from "react";
import { inputClass, labelClass, sectionClass } from "@/lib/onboarding/form-styles";
import type { OnboardingPersonal } from "@/lib/onboarding/types";

type PersonalDetailsStepProps = {
  value: OnboardingPersonal;
  onChange: (value: OnboardingPersonal) => void;
};

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];

export function PersonalDetailsStep({ value, onChange }: PersonalDetailsStepProps) {
  function update(field: keyof OnboardingPersonal) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      onChange({ ...value, [field]: event.target.value });
    };
  }

  return (
    <div className={sectionClass}>
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Personal profile</h2>
        <p className="mt-1 text-sm text-muted">
          Help your organisation match you with the right participants and service lines.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Preferred name (optional)</span>
          <input
            type="text"
            value={value.preferredName}
            onChange={update("preferredName")}
            placeholder="How you'd like to be addressed"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Date of birth</span>
          <input type="date" value={value.dateOfBirth} onChange={update("dateOfBirth")} className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Gender</span>
          <select value={value.gender} onChange={update("gender")} className={inputClass}>
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Languages spoken</span>
          <input
            type="text"
            value={value.languages}
            onChange={update("languages")}
            placeholder="e.g. English, Arabic, Auslan"
            className={inputClass}
          />
        </label>

        <label className="block md:col-span-2">
          <span className={labelClass}>Short bio (optional)</span>
          <textarea
            value={value.bio}
            onChange={update("bio")}
            rows={4}
            placeholder="Brief experience, interests, or strengths relevant to support work"
            className={`${inputClass} resize-none`}
          />
        </label>
      </div>
    </div>
  );
}

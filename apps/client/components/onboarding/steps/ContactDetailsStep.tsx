"use client";

import type { ChangeEvent } from "react";
import { ConstrainedSelect } from "@/components/ui/ConstrainedSelect";
import { AU_STATES } from "@/lib/onboarding/constants";
import { inputClass, labelClass, sectionClass } from "@/lib/onboarding/form-styles";
import type { OnboardingContact } from "@/lib/onboarding/types";

type ContactDetailsStepProps = {
  value: OnboardingContact;
  onChange: (value: OnboardingContact) => void;
};

export function ContactDetailsStep({ value, onChange }: ContactDetailsStepProps) {
  function update(field: keyof OnboardingContact) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ ...value, [field]: event.target.value });
    };
  }

  return (
    <div className={sectionClass}>
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Contact details</h2>
        <p className="mt-1 text-sm text-muted">
          How we can reach you and where you are based for rostering and compliance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={labelClass}>Mobile phone</span>
          <input
            type="tel"
            value={value.phone}
            onChange={update("phone")}
            placeholder="04XX XXX XXX"
            className={inputClass}
          />
        </label>

        <label className="block md:col-span-2">
          <span className={labelClass}>Street address</span>
          <input
            type="text"
            value={value.addressLine1}
            onChange={update("addressLine1")}
            placeholder="Unit / street number and name"
            className={inputClass}
          />
        </label>

        <label className="block md:col-span-2">
          <span className={labelClass}>Address line 2 (optional)</span>
          <input
            type="text"
            value={value.addressLine2}
            onChange={update("addressLine2")}
            placeholder="Building, level, etc."
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Suburb</span>
          <input type="text" value={value.suburb} onChange={update("suburb")} className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>State</span>
          <ConstrainedSelect
            aria-label="State"
            value={value.state}
            placeholder="Select state"
            onChange={(next) => onChange({ ...value, state: next })}
            options={[
              { value: "", label: "Select state" },
              ...AU_STATES.map((state) => ({ value: state, label: state })),
            ]}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Postcode</span>
          <input
            type="text"
            value={value.postcode}
            onChange={update("postcode")}
            maxLength={4}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-10 border-t border-border/60 pt-8">
        <h3 className="text-base font-semibold">Emergency contact</h3>
        <p className="mt-1 text-sm text-muted">Required for field work and shift safety protocols.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Full name</span>
            <input type="text" value={value.emergencyName} onChange={update("emergencyName")} className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Phone</span>
            <input type="tel" value={value.emergencyPhone} onChange={update("emergencyPhone")} className={inputClass} />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}>Relationship</span>
            <input
              type="text"
              value={value.emergencyRelation}
              onChange={update("emergencyRelation")}
              placeholder="e.g. Partner, parent, sibling"
              className={inputClass}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

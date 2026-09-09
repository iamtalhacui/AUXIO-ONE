"use client";

import type { ChangeEvent } from "react";
import type { FieldDef } from "@/lib/onboarding/templates";
import type { OnboardingFormValues } from "@/lib/onboarding/wizard-state";
import { inputClass, labelClass } from "@/lib/onboarding/form-styles";

type TemplateFieldsFormProps = {
  fields: FieldDef[];
  values: OnboardingFormValues;
  onChange: (values: OnboardingFormValues) => void;
};

function RequiredMark({ required }: { required?: boolean }) {
  if (!required) return null;
  return <span className="text-red-500"> *</span>;
}

export function TemplateFieldsForm({ fields, values, onChange }: TemplateFieldsFormProps) {
  function setValue(key: string, value: string | string[]) {
    onChange({ ...values, [key]: value });
  }

  function onInput(key: string) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValue(key, event.target.value);
    };
  }

  function toggleChip(key: string, option: string) {
    const current = Array.isArray(values[key]) ? (values[key] as string[]) : [];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    setValue(key, next);
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.key];
        const wrapperClass = field.fullWidth ? "md:col-span-2" : "";

        if (field.type === "chips" && field.options) {
          const selected = Array.isArray(value) ? value : [];
          return (
            <div key={field.key} className={wrapperClass}>
              <p className={labelClass}>
                {field.label}
                <RequiredMark required={field.required} />
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {field.options.map((option) => {
                  const active = selected.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleChip(field.key, option.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <label key={field.key} className={`block ${wrapperClass}`}>
              <span className={labelClass}>
                {field.label}
                <RequiredMark required={field.required} />
              </span>
              <textarea
                value={typeof value === "string" ? value : ""}
                onChange={onInput(field.key)}
                rows={4}
                placeholder={field.placeholder}
                readOnly={field.readOnly}
                className={`${inputClass} mt-1.5 resize-none ${field.readOnly ? "bg-[#f4f6f8]" : ""}`}
              />
            </label>
          );
        }

        if (field.type === "select" && field.options) {
          return (
            <label key={field.key} className={`block ${wrapperClass}`}>
              <span className={labelClass}>
                {field.label}
                <RequiredMark required={field.required} />
              </span>
              <select
                value={typeof value === "string" ? value : ""}
                onChange={onInput(field.key)}
                disabled={field.readOnly}
                className={`${inputClass} mt-1.5 ${field.readOnly ? "bg-[#f4f6f8]" : ""}`}
              >
                <option value="">Select…</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        return (
          <label key={field.key} className={`block ${wrapperClass}`}>
            <span className={labelClass}>
              {field.label}
              <RequiredMark required={field.required} />
            </span>
            <input
              type={field.type === "email" || field.type === "tel" || field.type === "date" ? field.type : "text"}
              value={typeof value === "string" ? value : ""}
              onChange={onInput(field.key)}
              placeholder={field.placeholder}
              readOnly={field.readOnly}
              className={`${inputClass} mt-1.5 ${field.readOnly ? "bg-[#f4f6f8]" : ""}`}
            />
          </label>
        );
      })}
    </div>
  );
}

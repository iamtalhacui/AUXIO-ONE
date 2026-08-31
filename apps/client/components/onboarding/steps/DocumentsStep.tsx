"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { useUploadOnboardingDocumentMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { sectionClass } from "@/lib/onboarding/form-styles";
import type { OnboardingDocuments, UploadedFileMeta } from "@/lib/onboarding/types";

type DocumentsStepProps = {
  value: OnboardingDocuments;
  onChange: (value: OnboardingDocuments) => void;
};

type DocumentField = {
  key: keyof OnboardingDocuments;
  label: string;
  required: boolean;
  hint: string;
};

const DOCUMENT_FIELDS: DocumentField[] = [
  {
    key: "photoId",
    label: "Photo identification",
    required: true,
    hint: "Driver licence, passport, or proof of age card",
  },
  {
    key: "qualifications",
    label: "Qualifications & certifications",
    required: true,
    hint: "Relevant certificates, diplomas, or training records",
  },
  {
    key: "wwcc",
    label: "Working with children check",
    required: true,
    hint: "Current WWCC or equivalent clearance",
  },
  {
    key: "policeCheck",
    label: "National police check",
    required: false,
    hint: "Optional but recommended for faster approval",
  },
  {
    key: "firstAid",
    label: "First aid certificate",
    required: false,
    hint: "Current first aid / CPR if available",
  },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsStep({ value, onChange }: DocumentsStepProps) {
  const [uploadDocument] = useUploadOnboardingDocumentMutation();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleFile(key: keyof OnboardingDocuments) {
    return async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError("");
      setUploadingKey(key);

      try {
        const meta = await uploadDocument({ docType: key, file }).unwrap();
        onChange({ ...value, [key]: meta as UploadedFileMeta });
      } catch (err) {
        setError(getErrorMessage(err, "Could not upload file"));
      } finally {
        setUploadingKey(null);
        event.target.value = "";
      }
    };
  }

  function removeFile(key: keyof OnboardingDocuments) {
    onChange({ ...value, [key]: null });
  }

  return (
    <div className={sectionClass}>
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Documents & evidence</h2>
        <p className="mt-1 text-sm text-muted">
          Upload clear copies of your compliance documents. PDF, JPG, or PNG up to 10 MB each.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">
        {DOCUMENT_FIELDS.map((field) => {
          const uploaded = value[field.key];
          const isUploading = uploadingKey === field.key;

          return (
            <div
              key={field.key}
              className="rounded-2xl border border-border/70 bg-background/50 p-5 transition hover:border-primary/20"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{field.label}</h3>
                    {field.required ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Required
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{field.hint}</p>
                </div>

                {uploaded ? (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{uploaded.name}</p>
                      <p className="text-xs text-muted">{formatFileSize(uploaded.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(field.key)}
                      className="ml-2 text-sm font-medium text-muted hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className={`cursor-pointer ${isUploading ? "pointer-events-none opacity-60" : ""}`}>
                    <span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/30 bg-surface px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      {isUploading ? "Uploading..." : "Upload file"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={isUploading}
                      onChange={handleFile(field.key)}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

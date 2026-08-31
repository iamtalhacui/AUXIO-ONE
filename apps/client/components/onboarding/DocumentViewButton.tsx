"use client";

import { useState } from "react";
import { openOnboardingDocument } from "@/lib/onboarding/documents";
import type { UploadedFileMeta } from "@/lib/onboarding/types";
import { useAppSelector } from "@/lib/store/hooks";

type DocumentViewButtonProps = {
  file: UploadedFileMeta;
  label?: string;
};

export function DocumentViewButton({ file, label = "View document" }: DocumentViewButtonProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleOpen() {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      await openOnboardingDocument(file.storedName, accessToken);
    } catch {
      setError("Could not open file");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {loading ? "Opening..." : label}
      </button>
      <p className="mt-1 text-xs text-muted">{file.name}</p>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

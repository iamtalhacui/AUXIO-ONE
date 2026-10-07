"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useActivateCustomerMutation,
  useDeleteCustomerDocMutation,
  useGetCustomerQuery,
  useUploadCustomerMandatoryDocMutation,
  useUploadCustomerOptionalDocMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

export function ManagerCustomerDetailContent({ customerId }: { customerId: string }) {
  const { data: customer, isLoading, error } = useGetCustomerQuery(customerId);
  const [uploadMandatory, { isLoading: uploadingMandatory }] =
    useUploadCustomerMandatoryDocMutation();
  const [uploadOptional, { isLoading: uploadingOptional }] =
    useUploadCustomerOptionalDocMutation();
  const [deleteDoc] = useDeleteCustomerDocMutation();
  const [activate, { isLoading: activating, error: activateError }] =
    useActivateCustomerMutation();
  const [optionalLabel, setOptionalLabel] = useState("");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  async function onMandatoryFile(fieldKey: string, file: File | null) {
    if (!file) return;
    setLocalError("");
    setMessage("");
    try {
      await uploadMandatory({ customerId, fieldKey, file }).unwrap();
      setMessage("Document uploaded");
    } catch (err) {
      setLocalError(getErrorMessage(err, "Upload failed"));
    }
  }

  async function onOptionalSubmit(event: FormEvent) {
    event.preventDefault();
    const input = (event.target as HTMLFormElement).elements.namedItem(
      "optionalFile",
    ) as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setLocalError("Choose a file to upload");
      return;
    }
    if (!optionalLabel.trim()) {
      setLocalError("Enter a label for the optional document");
      return;
    }
    setLocalError("");
    setMessage("");
    try {
      await uploadOptional({
        customerId,
        label: optionalLabel.trim(),
        file,
      }).unwrap();
      setOptionalLabel("");
      input.value = "";
      setMessage("Optional document uploaded");
    } catch (err) {
      setLocalError(getErrorMessage(err, "Upload failed"));
    }
  }

  async function onActivate() {
    setLocalError("");
    setMessage("");
    try {
      await activate(customerId).unwrap();
      setMessage("Customer activated");
    } catch {
      // shown via activateError
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading customer…</p>;
  if (error || !customer) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load this customer.")}
      </p>
    );
  }

  const errorMessage =
    localError ||
    (activateError ? getErrorMessage(activateError, "Could not activate customer") : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.displayName}
        description={`${customer.status} · ${customer.serviceLine || "No service line"}`}
        action={
          <Link href="/customers" className="btn-secondary">
            Back to list
          </Link>
        }
      />

      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Email</dt>
            <dd className="mt-1 text-sm font-medium">{customer.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Phone</dt>
            <dd className="mt-1 text-sm font-medium">{customer.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Plan</dt>
            <dd className="mt-1 text-sm font-medium">
              {customer.planStartDate
                ? new Date(customer.planStartDate).toLocaleDateString("en-AU")
                : "—"}{" "}
              →{" "}
              {customer.planEndDate
                ? new Date(customer.planEndDate).toLocaleDateString("en-AU")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Source opportunity</dt>
            <dd className="mt-1 text-sm font-medium">
              {customer.sourceOpportunityId ? "Converted from CRM" : "Manual entry"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Required documents</h2>
          <p className="mt-1 text-sm text-muted">
            Same required slots for every customer. Upload these before activating.
          </p>
        </div>
        <ul className="space-y-3">
          {customer.mandatoryDocs.map((slot) => (
            <li
              key={slot.fieldKey}
              className="flex flex-col gap-3 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">{slot.label}</p>
                <p className="text-xs text-muted">
                  {slot.uploaded && slot.document
                    ? slot.document.fileName
                    : "Not uploaded yet"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {slot.document ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      deleteDoc({
                        customerId,
                        documentId: slot.document!.id,
                      })
                    }
                  >
                    Remove
                  </button>
                ) : null}
                <label className="btn-secondary cursor-pointer">
                  {uploadingMandatory ? "Uploading…" : slot.uploaded ? "Replace" : "Upload"}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploadingMandatory}
                    onChange={(e) =>
                      onMandatoryFile(slot.fieldKey, e.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Optional documents</h2>
          <p className="mt-1 text-sm text-muted">
            Add any extra evidence with your own label.
          </p>
        </div>

        {customer.optionalDocs.length ? (
          <ul className="space-y-2">
            {customer.optionalDocs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{doc.label}</span>
                  <span className="ml-2 text-muted">{doc.fileName}</span>
                </span>
                <button
                  type="button"
                  className="text-sm font-semibold text-accent"
                  onClick={() => deleteDoc({ customerId, documentId: doc.id })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No optional documents yet.</p>
        )}

        <form onSubmit={onOptionalSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className="input-field"
            placeholder="Label (e.g. Consent form)"
            value={optionalLabel}
            onChange={(e) => setOptionalLabel(e.target.value)}
          />
          <input name="optionalFile" type="file" className="input-field" />
          <button
            type="submit"
            disabled={uploadingOptional}
            className="btn-secondary disabled:opacity-70"
          >
            {uploadingOptional ? "Uploading…" : "Add"}
          </button>
        </form>
      </section>

      {errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {message}
        </p>
      ) : null}

      {customer.status === "ONBOARDING" ? (
        <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 p-6">
          <p className="text-sm text-muted">
            {customer.canActivate
              ? "Required documents are complete. Activate to mark this customer service-ready."
              : "Upload all required documents before activating."}
          </p>
          <button
            type="button"
            disabled={!customer.canActivate || activating}
            onClick={onActivate}
            className="btn-primary disabled:opacity-70"
          >
            {activating ? "Activating…" : "Activate customer"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

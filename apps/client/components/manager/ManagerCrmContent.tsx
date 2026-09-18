"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useConvertCrmOpportunityMutation,
  useCreateCrmOpportunityMutation,
  useGetCrmPipelineQuery,
  useListCrmOpportunitiesQuery,
  useUpdateCrmOpportunityMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import type { OpportunityStage } from "@/lib/api/types";

const STAGES: OpportunityStage[] = [
  "ENQUIRY",
  "QUALIFIED",
  "PROPOSAL",
  "ACCEPTED",
  "LOST",
];

function money(value: number) {
  return value.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

export function ManagerCrmContent() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: pipeline, isLoading: pipelineLoading } = useGetCrmPipelineQuery();
  const { data: opportunities = [], isLoading, error } = useListCrmOpportunitiesQuery();
  const [createOpp, { isLoading: creating, error: createError, reset }] =
    useCreateCrmOpportunityMutation();
  const [updateOpp] = useUpdateCrmOpportunityMutation();
  const [convertOpp, { isLoading: converting }] = useConvertCrmOpportunityMutation();

  const [title, setTitle] = useState("");
  const [serviceLine, setServiceLine] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [estimatedAnnualValue, setEstimatedAnnualValue] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    reset();
    setLocalError("");
    try {
      await createOpp({
        title,
        serviceLine: serviceLine || undefined,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        estimatedAnnualValue: estimatedAnnualValue
          ? Number(estimatedAnnualValue)
          : undefined,
        nextFollowUpAt: nextFollowUpAt || undefined,
        followUpNote: followUpNote || undefined,
      }).unwrap();
      setTitle("");
      setServiceLine("");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setEstimatedAnnualValue("");
      setNextFollowUpAt("");
      setFollowUpNote("");
      toast({ variant: "success", title: "Opportunity created" });
    } catch (err) {
      toast({ variant: "error", title: "Could not create opportunity", description: getErrorMessage(err, "Could not create opportunity") });
    }
  }

  async function handleConvert(id: string) {
    setLocalError("");
    try {
      const result = await convertOpp(id).unwrap();
      toast({ variant: "success", title: result.message });
      router.push(`/manager/customers/${result.customer.id}`);
    } catch (err) {
      const message = getErrorMessage(err, "Could not convert opportunity");
      setLocalError(message);
      toast({ variant: "error", title: "Could not convert opportunity", description: message });
    }
  }

  if (isLoading || pipelineLoading) {
    return <p className="text-sm text-muted">Loading CRM…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load CRM. Is the CRM module enabled?")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Capture enquiries and convert accepted work into customer onboarding."
        action={
          <Link href="/manager/customers" className="btn-secondary">
            Open customers
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-5">
        {(pipeline?.stages ?? []).map((stage) => (
          <article key={stage.stage} className="dashboard-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {stage.stage.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-2xl font-semibold">{stage.count}</p>
            <p className="mt-1 text-xs text-muted">
              Est. {money(stage.estimatedAnnualValue)} / yr
            </p>
          </article>
        ))}
      </section>
      <p className="text-xs text-muted">
        {pipeline?.note ?? "Values are estimated annual amounts, not actual revenue."}
      </p>

      <form onSubmit={handleCreate} className="dashboard-card space-y-4 p-6">
        <h2 className="text-lg font-semibold">New opportunity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="input-label">Title *</span>
            <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="block">
            <span className="input-label">Service line</span>
            <input className="input-field" value={serviceLine} onChange={(e) => setServiceLine(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Estimated annual value</span>
            <input
              type="number"
              min={0}
              className="input-field"
              value={estimatedAnnualValue}
              onChange={(e) => setEstimatedAnnualValue(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="input-label">Contact name</span>
            <input className="input-field" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Contact email</span>
            <input type="email" className="input-field" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Contact phone</span>
            <input className="input-field" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Next follow-up</span>
            <input type="date" className="input-field" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="input-label">Follow-up note</span>
            <input className="input-field" value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} />
          </label>
        </div>
        {createError ? (
          <p className="text-sm text-red-600">
            {getErrorMessage(createError, "Could not create opportunity")}
          </p>
        ) : null}
        <button type="submit" disabled={creating} className="btn-primary disabled:opacity-70">
          {creating ? "Saving…" : "Create opportunity"}
        </button>
      </form>

      {localError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {localError}
        </p>
      ) : null}

      <div className="data-table-wrap">
        {opportunities.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No opportunities yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Stage</th>
                <th>Est. value</th>
                <th>Follow-up</th>
                <th>Customer</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id}>
                  <td>
                    <p className="font-medium">{opp.title}</p>
                    <p className="text-xs text-muted">
                      {opp.serviceLine || "—"} · {opp.contactName || "No contact"}
                    </p>
                  </td>
                  <td>
                    <select
                      className="input-field max-w-[10rem]"
                      value={opp.stage}
                      onChange={(e) =>
                        updateOpp({
                          id: opp.id,
                          stage: e.target.value as OpportunityStage,
                        })
                          .unwrap()
                          .then(() => toast({ variant: "success", title: "Stage updated" }))
                          .catch((err) =>
                            toast({
                              variant: "error",
                              title: "Could not update stage",
                              description: getErrorMessage(err, "Could not update stage"),
                            }),
                          )
                      }
                    >
                      {STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-muted">
                    {opp.estimatedAnnualValue != null
                      ? money(opp.estimatedAnnualValue)
                      : "—"}
                  </td>
                  <td className="text-muted">
                    {opp.nextFollowUpAt
                      ? new Date(opp.nextFollowUpAt).toLocaleDateString("en-AU")
                      : "—"}
                  </td>
                  <td className="text-muted">
                    {opp.convertedCustomer ? (
                      <Link
                        href={`/manager/customers/${opp.convertedCustomer.id}`}
                        className="font-semibold text-primary"
                      >
                        Open customer
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {!opp.convertedCustomer ? (
                      <button
                        type="button"
                        disabled={converting}
                        onClick={() => handleConvert(opp.id)}
                        className="text-sm font-semibold text-primary disabled:opacity-70"
                      >
                        Convert
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

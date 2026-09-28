"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { IncidentStatusPill } from "@/components/incidents/IncidentStatusPill";
import { IncidentSeverityPill } from "@/components/incidents/IncidentSeverityPill";
import {
  INCIDENT_ACTION_STATUS_LABELS,
  INCIDENT_SEVERITIES,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
} from "@/lib/incidents/constants";
import {
  formatIncidentDateTime,
  formatIsoDateTime,
  typeLabel,
} from "@/lib/incidents/format";
import {
  useCreateIncidentActionMutation,
  useGetIncidentQuery,
  useListOrgTeamQuery,
  useUpdateIncidentActionMutation,
  useUpdateIncidentMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type {
  IncidentActionStatus,
  IncidentReportabilityDecision,
  IncidentSeverity,
  IncidentStatus,
  UpdateIncidentRequest,
} from "@/lib/api/types";
import { useAppSelector } from "@/lib/store/hooks";
import { useToast } from "@/components/toast/ToastProvider";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";

export function ManagerIncidentDetailContent({ incidentId }: { incidentId: string }) {
  const { toast } = useToast();
  const token = useAppSelector((s) => s.orgAuth.accessToken);
  const {
    data: incident,
    isLoading,
    isError,
    error,
  } = useGetIncidentQuery(incidentId);
  const { data: team = [] } = useListOrgTeamQuery(undefined, {
    // Assignees optional — WORKFORCE may be off for some orgs.
    skip: false,
  });
  const [updateIncident, updateState] = useUpdateIncidentMutation();
  const [createAction, createActionState] = useCreateIncidentActionMutation();
  const [updateAction, updateActionState] = useUpdateIncidentActionMutation();

  const [managementNotes, setManagementNotes] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [followUpDue, setFollowUpDue] = useState("");
  const [followUpAssignee, setFollowUpAssignee] = useState("");
  const [decision, setDecision] = useState<IncidentReportabilityDecision>("NOT_ASSESSED");
  const [rationale, setRationale] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [notifyNotes, setNotifyNotes] = useState("");
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!incident) return;
    setManagementNotes(incident.managementNotes ?? "");
    setDecision(incident.reportability.decision);
    setRationale(incident.reportability.rationale || incident.reportability.notes || "");
    setExternalRef(incident.reportability.externalRef || "");
    setNotifyNotes(incident.reportability.notifyNotes || "");
    setNotified(Boolean(incident.reportability.notifiedAt));
  }, [incident]);

  const busy =
    updateState.isLoading || createActionState.isLoading || updateActionState.isLoading;

  async function patchIncident(body: UpdateIncidentRequest) {
    try {
      await updateIncident({ id: incidentId, ...body }).unwrap();
      toast({ variant: "success", title: "Incident updated" });
    } catch (err) {
      toast({
        variant: "error",
        title: "Update failed",
        description: getErrorMessage(err, "Could not update incident"),
      });
    }
  }

  async function onStatus(next: IncidentStatus) {
    await patchIncident({ status: next });
  }

  async function onSeverity(next: IncidentSeverity) {
    await patchIncident({ severity: next });
  }

  async function onSaveNotes() {
    await patchIncident({ managementNotes });
  }

  async function onSaveReportability() {
    if (decision === "NOT_ASSESSED") {
      toast({
        variant: "error",
        title: "Select a decision",
        description: "Choose reportable or not reportable.",
      });
      return;
    }
    await patchIncident({
      reportabilityDecision: decision,
      reportabilityRationale: rationale.trim(),
      reportabilityExternalRef: externalRef.trim(),
      reportabilityNotifyNotes: notifyNotes.trim(),
      reportabilityNotified: notified,
    });
  }

  async function onAddFollowUp() {
    if (followUpText.trim().length < 3) {
      toast({ variant: "error", title: "Enter a follow-up action" });
      return;
    }
    try {
      await createAction({
        incidentId,
        description: followUpText.trim(),
        kind: "CUSTOM",
        dueDate: followUpDue || undefined,
        assignedUserId: followUpAssignee || undefined,
      }).unwrap();
      setFollowUpText("");
      setFollowUpDue("");
      setFollowUpAssignee("");
      toast({ variant: "success", title: "Follow-up added" });
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not add follow-up",
        description: getErrorMessage(err, "Try again"),
      });
    }
  }

  async function onToggleAction(actionId: string, done: boolean) {
    try {
      await updateAction({
        incidentId,
        actionId,
        status: (done ? "OPEN" : "DONE") as IncidentActionStatus,
      }).unwrap();
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not update action",
        description: getErrorMessage(err, "Try again"),
      });
    }
  }

  async function downloadAttachment(attachmentId: string, fileName: string) {
    if (!token) return;
    try {
      const res = await fetch(
        `${SERVER_URL}/organisation/incidents/${incidentId}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        variant: "error",
        title: "Download failed",
        description: getErrorMessage(err, "Could not download attachment"),
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="dashboard-card h-24 animate-pulse" />
        <div className="dashboard-card h-96 animate-pulse" />
      </div>
    );
  }

  if (isError || !incident) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getErrorMessage(error, "Incident not found.")}
        </p>
      </div>
    );
  }

  const statusOptions = Array.from(
    new Set([incident.status, ...(incident.allowedStatusTransitions ?? [])]),
  );

  const actions = incident.actions?.length
    ? incident.actions
    : incident.followUpActions ?? [];

  return (
    <div className="space-y-5">
      <BackLink />

      <PageHeader
        title={incident.reference}
        description={`${typeLabel(incident.type)} · ${formatIncidentDateTime(incident.date, incident.approximateTime)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <IncidentSeverityPill severity={incident.severity} />
            <IncidentStatusPill status={incident.status} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-5">
          <section className="dashboard-card grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Reporter" value={incident.reporterName} />
            <Field label="Participant" value={incident.participantName || "—"} />
            <Field label="Shift" value={incident.shiftLabel || "—"} />
            <Field label="Location" value={incident.location} />
            <Field label="Incident type" value={typeLabel(incident.type)} />
            <Field label="Reported" value={formatIsoDateTime(incident.reportedAt)} />
            <Field
              label="Initial severity"
              value={INCIDENT_SEVERITY_LABELS[incident.initialSeverity]}
            />
            <Field
              label="Current severity"
              value={INCIDENT_SEVERITY_LABELS[incident.currentSeverity]}
            />
            <div className="sm:col-span-2">
              <Field label="People involved" value={incident.peopleInvolved || "—"} />
            </div>
          </section>

          <section className="dashboard-card space-y-4 p-5">
            <h2 className="text-base font-semibold text-foreground">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {incident.description}
            </p>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Immediate action</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                {incident.immediateAction || "—"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Next steps</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                {incident.nextSteps || "—"}
              </p>
            </div>
          </section>

          <section className="dashboard-card space-y-3 p-5">
            <h2 className="text-base font-semibold text-foreground">Management notes</h2>
            <textarea
              className="input-field min-h-[88px]"
              value={managementNotes}
              disabled={busy}
              onChange={(e) => setManagementNotes(e.target.value)}
              placeholder="Internal notes for triage and handover…"
            />
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => void onSaveNotes()}
            >
              Save notes
            </button>
          </section>

          <section className="dashboard-card space-y-3 p-5">
            <h2 className="text-base font-semibold text-foreground">Attachments</h2>
            {incident.attachments.length === 0 ? (
              <p className="text-sm text-muted">No attachments uploaded.</p>
            ) : (
              <ul className="divide-y divide-border/40 rounded-xl border border-border/60">
                {incident.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-foreground">{a.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted">{a.sizeLabel}</span>
                      <button
                        type="button"
                        className="font-semibold text-primary"
                        onClick={() => void downloadAttachment(a.id, a.fileName || a.name)}
                      >
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-card space-y-4 p-5">
            <h2 className="text-base font-semibold text-foreground">Follow-up actions</h2>
            {actions.length === 0 ? (
              <p className="text-sm text-muted">No follow-ups yet.</p>
            ) : (
              <ul className="space-y-2">
                {actions.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 rounded-xl border border-border/60 px-3.5 py-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={f.done || f.status === "DONE"}
                      disabled={busy}
                      onChange={() =>
                        void onToggleAction(f.id, f.done || f.status === "DONE")
                      }
                      aria-label={`Mark follow-up ${f.done ? "incomplete" : "complete"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          f.done || f.status === "DONE"
                            ? "text-muted line-through"
                            : "text-foreground"
                        }`}
                      >
                        {f.description || f.text}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {[
                          INCIDENT_ACTION_STATUS_LABELS[f.status],
                          f.assignedUserName || f.assignee,
                          f.dueDate ? `Due ${f.dueDate}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input-field sm:col-span-2"
                placeholder="Add a follow-up action…"
                value={followUpText}
                disabled={busy}
                onChange={(e) => setFollowUpText(e.target.value)}
              />
              <select
                className="input-field"
                value={followUpAssignee}
                disabled={busy}
                onChange={(e) => setFollowUpAssignee(e.target.value)}
              >
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="input-field"
                value={followUpDue}
                disabled={busy}
                onChange={(e) => setFollowUpDue(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => void onAddFollowUp()}
            >
              Add follow-up
            </button>
          </section>

          <section className="dashboard-card space-y-4 p-5">
            <h2 className="text-base font-semibold text-foreground">Reportability review</h2>
            <p className="text-sm text-muted">
              Record the authorised person&apos;s decision. The system does not auto-decide
              NDIS or aged-care reportability.
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reportable"
                  checked={decision === "REPORTABLE"}
                  onChange={() => setDecision("REPORTABLE")}
                />
                Reportable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reportable"
                  checked={decision === "NOT_REPORTABLE"}
                  onChange={() => setDecision("NOT_REPORTABLE")}
                />
                Not reportable
              </label>
            </div>
            <div>
              <label className="input-label" htmlFor="report-rationale">
                Decision / rationale
              </label>
              <textarea
                id="report-rationale"
                className="input-field min-h-[88px]"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why this decision was made…"
              />
            </div>
            <div>
              <label className="input-label" htmlFor="report-ext">
                External reference <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="report-ext"
                className="input-field"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                placeholder="e.g. portal ticket / case number"
              />
            </div>
            <div>
              <label className="input-label" htmlFor="report-notify">
                Notification milestone / details{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="report-notify"
                className="input-field min-h-[72px]"
                value={notifyNotes}
                onChange={(e) => setNotifyNotes(e.target.value)}
                placeholder="Who was notified and when…"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notified}
                onChange={(e) => setNotified(e.target.checked)}
              />
              External notification recorded
            </label>
            {incident.reportability.assessed ? (
              <p className="text-xs text-muted">
                Last assessed by {incident.reportability.assessedBy || "—"} on{" "}
                {incident.reportability.assessedAt
                  ? formatIsoDateTime(incident.reportability.assessedAt)
                  : "—"}
              </p>
            ) : null}
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void onSaveReportability()}
            >
              Save assessment
            </button>
          </section>

          <section className="dashboard-card space-y-4 p-5">
            <h2 className="text-base font-semibold text-foreground">History</h2>
            <ol className="relative space-y-4 border-l border-border/70 pl-5">
              {[...incident.history].reverse().map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-semibold text-foreground">{h.action}</p>
                  <p className="text-xs text-muted">
                    {h.actor} · {formatIsoDateTime(h.at)}
                  </p>
                  {h.detail ? <p className="mt-1 text-sm text-muted">{h.detail}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="dashboard-card space-y-3 p-5">
            <h2 className="text-base font-semibold text-foreground">Workflow</h2>
            <p className="text-xs text-muted">
              Initial severity stays {INCIDENT_SEVERITY_LABELS[incident.initialSeverity]}. Only
              current severity changes in triage.
            </p>
            <div>
              <label className="input-label" htmlFor="mgr-status">
                Status
              </label>
              <select
                id="mgr-status"
                className="input-field"
                value={incident.status}
                disabled={busy}
                onChange={(e) => void onStatus(e.target.value as IncidentStatus)}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {INCIDENT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label" htmlFor="mgr-severity">
                Current severity
              </label>
              <select
                id="mgr-severity"
                className="input-field"
                value={incident.currentSeverity}
                disabled={busy}
                onChange={(e) => void onSeverity(e.target.value as IncidentSeverity)}
              >
                {INCIDENT_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {INCIDENT_SEVERITY_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              {incident.status === "PENDING_REVIEW" ? (
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={busy}
                  onClick={() => void onStatus("UNDER_REVIEW")}
                >
                  Start review
                </button>
              ) : null}
              {incident.status === "UNDER_REVIEW" ? (
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={busy}
                  onClick={() => void onStatus("ACTION_REQUIRED")}
                >
                  Mark action required
                </button>
              ) : null}
              {incident.status !== "RESOLVED" && incident.status !== "CLOSED" ? (
                <button
                  type="button"
                  className="btn-secondary w-full"
                  disabled={busy}
                  onClick={() => void onStatus("RESOLVED")}
                >
                  Mark resolved
                </button>
              ) : null}
              {incident.status === "RESOLVED" ? (
                <button
                  type="button"
                  className="btn-secondary w-full"
                  disabled={busy}
                  onClick={() => void onStatus("CLOSED")}
                >
                  Close incident
                </button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/manager/incidents"
      className="inline-flex text-sm font-semibold text-primary hover:underline"
    >
      ← Back to incidents
    </Link>
  );
}

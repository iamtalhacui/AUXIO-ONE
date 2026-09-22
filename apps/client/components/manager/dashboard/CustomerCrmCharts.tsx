"use client";

import type { ManagerOverview } from "@/lib/api/types";

const PIPELINE_STEPS = [
  { key: "ENQUIRY" as const, label: "Enquiry", color: "bg-slate-300" },
  { key: "QUALIFIED" as const, label: "Qualified", color: "bg-sky-400" },
  { key: "PROPOSAL" as const, label: "Proposal", color: "bg-amber-400" },
  { key: "ACCEPTED" as const, label: "Accepted", color: "bg-primary" },
  { key: "LOST" as const, label: "Lost", color: "bg-rose-300" },
];

const STATUS_COLORS = {
  ONBOARDING: "#f59e0b",
  ACTIVE: "#0f766e",
  PAUSED: "#94a3b8",
  ARCHIVED: "#cbd5e1",
} as const;

type CustomerCrmChartsProps = {
  customerStatusMix: ManagerOverview["customerStatusMix"];
  crmPipeline: ManagerOverview["crmPipeline"];
  pipelineValueByStage: ManagerOverview["pipelineValueByStage"];
  modules: ManagerOverview["modules"];
};

function money(value: number) {
  return value.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function CrmPipelineFunnel({
  pipeline,
  enabled,
}: {
  pipeline: ManagerOverview["crmPipeline"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        CRM module not enabled
      </div>
    );
  }

  const total = PIPELINE_STEPS.reduce((sum, step) => sum + pipeline[step.key], 0);

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No opportunities yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#f0eeeb]">
        {PIPELINE_STEPS.map((step) => {
          const value = pipeline[step.key];
          if (value === 0) return null;
          return (
            <div
              key={step.key}
              className={step.color}
              style={{ width: `${(value / total) * 100}%` }}
              title={`${step.label}: ${value}`}
            />
          );
        })}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {PIPELINE_STEPS.map((step) => (
          <li key={step.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${step.color}`} />
              {step.label}
            </span>
            <span className="font-semibold">{pipeline[step.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CustomerStatusDonut({
  statusMix,
  enabled,
}: {
  statusMix: ManagerOverview["customerStatusMix"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        Customers module not enabled
      </div>
    );
  }

  const total =
    statusMix.ONBOARDING + statusMix.ACTIVE + statusMix.PAUSED + statusMix.ARCHIVED;

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No customers yet
      </div>
    );
  }

  const segments = (["ONBOARDING", "ACTIVE", "PAUSED", "ARCHIVED"] as const)
    .map((key) => ({ key, value: statusMix[key] }))
    .filter((s) => s.value > 0);

  let cursor = 0;
  const stops = segments.map((s) => {
    const start = cursor;
    const pct = (s.value / total) * 100;
    cursor += pct;
    return `${STATUS_COLORS[s.key]} ${start}% ${cursor}%`;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={`Customer status: Onboarding ${statusMix.ONBOARDING}, Active ${statusMix.ACTIVE}, Paused ${statusMix.PAUSED}, Archived ${statusMix.ARCHIVED}`}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-semibold">{total}</span>
          <span className="text-xs text-muted">customers</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {(["ONBOARDING", "ACTIVE", "PAUSED", "ARCHIVED"] as const).map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="text-muted">
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </span>
            <span className="font-semibold">{statusMix[status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PipelineValueBars({
  values,
  enabled,
}: {
  values: ManagerOverview["pipelineValueByStage"];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        CRM module not enabled
      </div>
    );
  }

  const rows = [
    { label: "Enquiry", value: values.ENQUIRY, color: "bg-slate-400" },
    { label: "Qualified", value: values.QUALIFIED, color: "bg-sky-400" },
    { label: "Proposal", value: values.PROPOSAL, color: "bg-amber-400" },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No open pipeline value yet
      </div>
    );
  }

  return (
    <div className="flex h-36 flex-col justify-center gap-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted">{row.label}</span>
            <span className="font-semibold">{money(row.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#f0eeeb]">
            <div
              className={`h-full rounded-full ${row.color}`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CustomerCrmCharts({
  customerStatusMix,
  crmPipeline,
  pipelineValueByStage,
  modules,
}: CustomerCrmChartsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">CRM pipeline</h2>
        <p className="mb-4 text-sm text-muted">Enquiry → Lost</p>
        <CrmPipelineFunnel pipeline={crmPipeline} enabled={modules.crmEnabled} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Customer status</h2>
        <p className="mb-4 text-sm text-muted">Onboarding / Active / Paused / Archived</p>
        <CustomerStatusDonut statusMix={customerStatusMix} enabled={modules.customersEnabled} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Pipeline value</h2>
        <p className="mb-4 text-sm text-muted">Estimated annual — open stages only</p>
        <PipelineValueBars values={pipelineValueByStage} enabled={modules.crmEnabled} />
      </article>
    </div>
  );
}

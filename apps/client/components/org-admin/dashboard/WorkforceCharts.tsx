"use client";

import type { OrgAdminOverview } from "@/lib/api/types";

const FUNNEL_STEPS = [
  { key: "NOT_STARTED" as const, label: "Not started", color: "bg-slate-300" },
  { key: "IN_PROGRESS" as const, label: "In progress", color: "bg-sky-400" },
  { key: "PENDING_REVIEW" as const, label: "Pending review", color: "bg-amber-400" },
  { key: "CHANGES_REQUIRED" as const, label: "Changes required", color: "bg-rose-400" },
  { key: "VERIFIED" as const, label: "Verified", color: "bg-primary" },
];

const ROLE_COLORS = {
  MANAGER: "#0f766e",
  ROSTERING_EXPERT: "#0891b2",
  EMPLOYEE: "#94a3b8",
} as const;

type WorkforceChartsProps = {
  onboardingFunnel: OrgAdminOverview["onboardingFunnel"];
  roleMix: OrgAdminOverview["roleMix"];
  approvalLoad: OrgAdminOverview["approvalLoadLast30Days"];
};

function OnboardingFunnel({ funnel }: { funnel: OrgAdminOverview["onboardingFunnel"] }) {
  const total = FUNNEL_STEPS.reduce((sum, step) => sum + funnel[step.key], 0);

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No team members yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#f0eeeb]">
        {FUNNEL_STEPS.map((step) => {
          const value = funnel[step.key];
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
        {FUNNEL_STEPS.map((step) => (
          <li key={step.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${step.color}`} />
              {step.label}
            </span>
            <span className="font-semibold">{funnel[step.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleMixDonut({ roleMix }: { roleMix: OrgAdminOverview["roleMix"] }) {
  const total = roleMix.MANAGER + roleMix.ROSTERING_EXPERT + roleMix.EMPLOYEE;

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No workforce members yet
      </div>
    );
  }

  const segments = (["MANAGER", "ROSTERING_EXPERT", "EMPLOYEE"] as const)
    .map((key) => ({ key, value: roleMix[key] }))
    .filter((s) => s.value > 0);

  let cursor = 0;
  const stops = segments.map((s) => {
    const start = cursor;
    const pct = (s.value / total) * 100;
    cursor += pct;
    return `${ROLE_COLORS[s.key]} ${start}% ${cursor}%`;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={`Role mix: Manager ${roleMix.MANAGER}, Rostering Expert ${roleMix.ROSTERING_EXPERT}, Employee ${roleMix.EMPLOYEE}`}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-semibold">{total}</span>
          <span className="text-xs text-muted">people</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {(["MANAGER", "ROSTERING_EXPERT", "EMPLOYEE"] as const).map((role) => (
          <li key={role} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: ROLE_COLORS[role] }}
            />
            <span className="text-muted">
              {role === "ROSTERING_EXPERT" ? "Rostering Expert" : role.charAt(0) + role.slice(1).toLowerCase()}
            </span>
            <span className="font-semibold">{roleMix[role]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ApprovalLoadBars({ approvalLoad }: { approvalLoad: OrgAdminOverview["approvalLoadLast30Days"] }) {
  const total = approvalLoad.autoApproved + approvalLoad.needsReview + approvalLoad.rejected;

  if (total === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-muted">
        No finished shifts in the last 30 days
      </div>
    );
  }

  const rows = [
    { label: "Auto-approved", value: approvalLoad.autoApproved, color: "bg-primary" },
    { label: "Needs review", value: approvalLoad.needsReview, color: "bg-amber-400" },
    { label: "Rejected", value: approvalLoad.rejected, color: "bg-rose-400" },
  ];

  return (
    <div className="flex h-36 flex-col justify-center gap-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted">{row.label}</span>
            <span className="font-semibold">{row.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#f0eeeb]">
            <div
              className={`h-full rounded-full ${row.color}`}
              style={{ width: `${(row.value / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorkforceCharts({ onboardingFunnel, roleMix, approvalLoad }: WorkforceChartsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Onboarding funnel</h2>
        <p className="mb-4 text-sm text-muted">Where the team stands today</p>
        <OnboardingFunnel funnel={onboardingFunnel} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Team role mix</h2>
        <p className="mb-4 text-sm text-muted">Manager / Rostering Expert / Employee</p>
        <RoleMixDonut roleMix={roleMix} />
      </article>

      <article className="dashboard-card p-5">
        <h2 className="text-lg font-semibold">Approval load</h2>
        <p className="mb-4 text-sm text-muted">Finished shifts, last 30 days</p>
        <ApprovalLoadBars approvalLoad={approvalLoad} />
      </article>
    </div>
  );
}

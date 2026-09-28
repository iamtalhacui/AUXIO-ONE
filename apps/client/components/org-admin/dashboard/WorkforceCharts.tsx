"use client";

import Link from "next/link";
import { Settings2, Shield, Users } from "lucide-react";
import type { OrgAdminOverview } from "@/lib/api/types";

const FUNNEL_STEPS = [
  { key: "NOT_STARTED" as const, label: "Not started", color: "bg-slate-300" },
  { key: "IN_PROGRESS" as const, label: "In progress", color: "bg-sky-400" },
  { key: "PENDING_REVIEW" as const, label: "Pending review", color: "bg-amber-400" },
  { key: "CHANGES_REQUIRED" as const, label: "Changes needed", color: "bg-rose-400" },
  { key: "VERIFIED" as const, label: "Verified", color: "bg-primary" },
];

const ROLE_META = [
  { key: "MANAGER" as const, label: "Managers", color: "var(--chart-teal)" },
  { key: "ROSTERING_EXPERT" as const, label: "Rostering", color: "var(--chart-sky)" },
  { key: "EMPLOYEE" as const, label: "Employees", color: "var(--chart-slate)" },
];

type WorkforceChartsProps = {
  onboardingFunnel: OrgAdminOverview["onboardingFunnel"];
  roleMix: OrgAdminOverview["roleMix"];
  approvalLoad: OrgAdminOverview["approvalLoadLast30Days"];
};

function OnboardingFunnel({ funnel }: { funnel: OrgAdminOverview["onboardingFunnel"] }) {
  const total = FUNNEL_STEPS.reduce((sum, step) => sum + funnel[step.key], 0);

  if (total === 0) {
    return <p className="oad-chart-empty">No team members yet</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
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
      <ul className="space-y-2">
        {FUNNEL_STEPS.filter((step) => funnel[step.key] > 0).map((step) => (
          <li key={step.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted">
              <span className={`h-2 w-2 rounded-full ${step.color}`} />
              {step.label}
            </span>
            <span className="font-semibold tabular-nums text-foreground">{funnel[step.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleMix({ roleMix }: { roleMix: OrgAdminOverview["roleMix"] }) {
  const total = ROLE_META.reduce((sum, role) => sum + roleMix[role.key], 0);

  if (total === 0) {
    return <p className="oad-chart-empty">No workforce members yet</p>;
  }

  const segments = ROLE_META.map((role) => ({ ...role, value: roleMix[role.key] })).filter(
    (s) => s.value > 0,
  );

  let cursor = 0;
  const stops = segments.map((s) => {
    const start = cursor;
    const pct = (s.value / total) * 100;
    cursor += pct;
    return `${s.color} ${start}% ${cursor}%`;
  });

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={`Team of ${total}`}
      >
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-xl font-semibold tabular-nums">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted">people</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {ROLE_META.map((role) => (
          <li key={role.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-muted">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: role.color }} />
              <span className="truncate">{role.label}</span>
            </span>
            <span className="font-semibold tabular-nums text-foreground">{roleMix[role.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ApprovalStrip({ approvalLoad }: { approvalLoad: OrgAdminOverview["approvalLoadLast30Days"] }) {
  const total = approvalLoad.autoApproved + approvalLoad.needsReview + approvalLoad.rejected;
  const rows = [
    { label: "Auto-approved", value: approvalLoad.autoApproved, tone: "ok" as const },
    { label: "Needs review", value: approvalLoad.needsReview, tone: "warn" as const },
    { label: "Rejected", value: approvalLoad.rejected, tone: "bad" as const },
  ];

  return (
    <div className="oad-approval">
      <div className="oad-approval-head">
        <div>
          <h2 className="oad-section-title">Shift outcomes</h2>
          <p className="oad-section-desc">Finished shifts · last 30 days</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-foreground">{total} total</p>
      </div>
      {total === 0 ? (
        <p className="oad-chart-empty py-6">No finished shifts in the last 30 days</p>
      ) : (
        <div className="oad-approval-grid">
          {rows.map((row) => (
            <div key={row.label} className={`oad-approval-cell oad-approval-${row.tone}`}>
              <p className="text-xs font-medium text-muted">{row.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{row.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SHORTCUTS = [
  { label: "Team directory", href: "/org-admin/team", icon: Users },
  { label: "Roles & permissions", href: "/org-admin/roles", icon: Shield },
  { label: "Organisation settings", href: "/org-admin/settings/organisation", icon: Settings2 },
] as const;

export function WorkforceCharts({ onboardingFunnel, roleMix, approvalLoad }: WorkforceChartsProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="oad-card">
          <h2 className="oad-section-title">Onboarding</h2>
          <p className="oad-section-desc mb-4">Where the team stands today</p>
          <OnboardingFunnel funnel={onboardingFunnel} />
        </article>

        <article className="oad-card">
          <h2 className="oad-section-title">Role mix</h2>
          <p className="oad-section-desc mb-4">Workforce composition</p>
          <RoleMix roleMix={roleMix} />
        </article>
      </div>

      <ApprovalStrip approvalLoad={approvalLoad} />

      <nav className="oad-shortcuts" aria-label="Quick links">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="oad-shortcut">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

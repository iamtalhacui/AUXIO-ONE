import type { ReactNode } from "react";

export function RolePlaceholder({
  roleLabel,
  description,
}: {
  roleLabel: string;
  description: string;
}) {
  return (
    <div className="dashboard-card p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{roleLabel}</p>
      <h1 className="mt-3 text-2xl font-semibold">Dashboard coming soon</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

export function OrgAdminOverview() {
  return (
    <RolePlaceholder
      roleLabel="Org Admin"
      description="Organisation setup, module toggles, and team management will live here."
    />
  );
}

export function ManagerOverview() {
  return (
    <RolePlaceholder
      roleLabel="Manager"
      description="Workforce oversight, compliance checks, and operational summaries will live here."
    />
  );
}

export function RosterOverview() {
  return (
    <RolePlaceholder
      roleLabel="Rostering Expert"
      description="Schedule building, shift matching, and roster publishing will live here."
    />
  );
}

export function EmployeeOverview() {
  return (
    <RolePlaceholder
      roleLabel="Employee"
      description="Your shifts, timesheets, progress notes, and assigned tasks will live here."
    />
  );
}

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="dashboard-card p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

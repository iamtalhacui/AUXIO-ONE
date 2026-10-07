import type { ShiftStatus } from "@/lib/api/types";

// Palettes below are remapped for dark mode in globals.css, so no dark: variants.
const STYLES: Record<ShiftStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  UNFILLED: "bg-amber-50 text-amber-800",
  OFFERED: "bg-sky-50 text-sky-700",
  ACCEPTED: "bg-primary/10 text-primary",
  IN_PROGRESS: "bg-emerald-50 text-emerald-800",
  PENDING_APPROVAL: "bg-orange-50 text-orange-800",
  APPROVED: "bg-emerald-50 text-emerald-800",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const LABELS: Record<ShiftStatus, string> = {
  DRAFT: "Draft",
  UNFILLED: "Unfilled",
  OFFERED: "Broadcast / open",
  ACCEPTED: "Assigned",
  IN_PROGRESS: "In progress",
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

/** Employees see their own position in the workflow, not the roster's. */
const EMPLOYEE_LABELS: Record<ShiftStatus, string> = {
  ...LABELS,
  OFFERED: "New offer",
  ACCEPTED: "Scheduled",
  PENDING_APPROVAL: "Awaiting approval",
  REJECTED: "Needs attention",
};

type Props = {
  status: ShiftStatus;
  audience?: "internal" | "employee";
  size?: "sm" | "md";
};

export function ShiftStatusPill({ status, audience = "internal", size = "md" }: Props) {
  const labels = audience === "employee" ? EMPLOYEE_LABELS : LABELS;
  const sizing = size === "sm" ? "!px-2 !py-0.5 !text-[11px]" : "";

  return (
    <span className={`status-pill ${STYLES[status]} ${sizing}`}>{labels[status]}</span>
  );
}

export function shiftStatusLabel(status: ShiftStatus) {
  return LABELS[status];
}

export function employeeShiftStatusLabel(status: ShiftStatus) {
  return EMPLOYEE_LABELS[status];
}

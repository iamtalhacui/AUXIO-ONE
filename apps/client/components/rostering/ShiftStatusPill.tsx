import type { ShiftStatus } from "@/lib/api/types";

const STYLES: Record<ShiftStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  UNFILLED: "bg-amber-50 text-amber-800",
  OFFERED: "bg-sky-50 text-sky-700",
  ACCEPTED: "bg-primary/10 text-primary",
  IN_PROGRESS: "bg-violet-50 text-violet-800",
  PENDING_APPROVAL: "bg-orange-50 text-orange-800",
  APPROVED: "bg-emerald-50 text-emerald-800",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const LABELS: Record<ShiftStatus, string> = {
  DRAFT: "Draft",
  UNFILLED: "Unfilled",
  OFFERED: "Offered",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function ShiftStatusPill({ status }: { status: ShiftStatus }) {
  return <span className={`status-pill ${STYLES[status]}`}>{LABELS[status]}</span>;
}

export function shiftStatusLabel(status: ShiftStatus) {
  return LABELS[status];
}

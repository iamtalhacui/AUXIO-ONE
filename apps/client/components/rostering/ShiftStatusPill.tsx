import type { ShiftStatus } from "@/lib/rostering/types";

const STYLES: Record<ShiftStatus, string> = {
  UNASSIGNED: "bg-amber-50 text-amber-800",
  OFFERED: "bg-sky-50 text-sky-700",
  ASSIGNED: "bg-primary/10 text-primary",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-50 text-red-700",
};

const LABELS: Record<ShiftStatus, string> = {
  UNASSIGNED: "Unassigned",
  OFFERED: "Offered",
  ASSIGNED: "Assigned",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function ShiftStatusPill({ status }: { status: ShiftStatus }) {
  return <span className={`status-pill ${STYLES[status]}`}>{LABELS[status]}</span>;
}

export function shiftStatusLabel(status: ShiftStatus) {
  return LABELS[status];
}

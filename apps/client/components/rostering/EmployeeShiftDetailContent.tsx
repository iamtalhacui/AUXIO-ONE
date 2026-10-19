"use client";

import { ShiftWorkspace } from "@/components/rostering/employee/ShiftWorkspace";

/**
 * Employee shift detail + Phase B execution:
 * Start → complete tasks + progress note → Finish (auto-approve or pending Manager).
 */
export function EmployeeShiftDetailContent({ shiftId }: { shiftId: string }) {
  return <ShiftWorkspace shiftId={shiftId} />;
}

import { redirect } from "next/navigation";

/** Shared route is /shift-approvals (any role with the approve action). */
export default function LegacyManagerShiftApprovalsPage() {
  redirect("/shift-approvals");
}

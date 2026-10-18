import { redirect } from "next/navigation";

/** Out-of-window shift approvals are owned by Managers now. */
export default function LegacyOrgAdminShiftApprovalsPage() {
  redirect("/org-admin");
}

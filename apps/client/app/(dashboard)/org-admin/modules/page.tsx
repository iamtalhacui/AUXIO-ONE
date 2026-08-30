import { redirect } from "next/navigation";

export default function OrgAdminModulesRedirectPage() {
  redirect("/org-admin/settings/modules");
}

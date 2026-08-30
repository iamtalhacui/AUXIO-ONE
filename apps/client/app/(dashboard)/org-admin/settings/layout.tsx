import type { ReactNode } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrgAdminSettingsNav } from "@/components/org-admin/OrgAdminSettingsNav";

export default function OrgAdminSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader
        title="Configuration"
        description="Manage your organisation profile, enabled modules, and account security."
      />
      <OrgAdminSettingsNav />
      {children}
    </>
  );
}

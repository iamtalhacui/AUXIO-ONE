import type { ReactNode } from "react";
import { OrgAuthGuard } from "@/components/auth/OrgAuthGuard";
import { OrgRoleGuard } from "@/components/auth/OrgRoleGuard";

export default function OrgAdminLayout({ children }: { children: ReactNode }) {
  return (
    <OrgAuthGuard>
      <OrgRoleGuard allow={["ORG_ADMIN"]}>{children}</OrgRoleGuard>
    </OrgAuthGuard>
  );
}

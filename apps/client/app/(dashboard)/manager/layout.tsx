import type { ReactNode } from "react";
import { OrgAuthGuard } from "@/components/auth/OrgAuthGuard";
import { OrgRoleGuard } from "@/components/auth/OrgRoleGuard";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <OrgAuthGuard>
      <OrgRoleGuard allow={["MANAGER"]}>{children}</OrgRoleGuard>
    </OrgAuthGuard>
  );
}

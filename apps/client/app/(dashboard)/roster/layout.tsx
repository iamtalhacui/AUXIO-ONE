import type { ReactNode } from "react";
import { OrgAuthGuard } from "@/components/auth/OrgAuthGuard";
import { OrgRoleGuard } from "@/components/auth/OrgRoleGuard";

export default function RosterLayout({ children }: { children: ReactNode }) {
  return (
    <OrgAuthGuard>
      <OrgRoleGuard allow={["ROSTERING_EXPERT"]}>{children}</OrgRoleGuard>
    </OrgAuthGuard>
  );
}

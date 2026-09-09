import type { ReactNode } from "react";
import { OrgAuthGuard } from "@/components/auth/OrgAuthGuard";
import { OrgRoleGuard } from "@/components/auth/OrgRoleGuard";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <OrgAuthGuard>
      <OrgRoleGuard allow={["EMPLOYEE"]}>{children}</OrgRoleGuard>
    </OrgAuthGuard>
  );
}

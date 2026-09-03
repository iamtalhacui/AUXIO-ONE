import type { ReactNode } from "react";
import { OrgAuthGuard } from "@/components/auth/OrgAuthGuard";

export default function OrgAdminLayout({ children }: { children: ReactNode }) {
  return <OrgAuthGuard>{children}</OrgAuthGuard>;
}

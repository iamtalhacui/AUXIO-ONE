import type { ReactNode } from "react";
import { PlatformAuthGuard } from "@/components/auth/PlatformAuthGuard";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <PlatformAuthGuard>{children}</PlatformAuthGuard>;
}

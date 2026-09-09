"use client";

import { usePathname } from "next/navigation";
import { useOrgMeQuery } from "@/lib/api/authApi";

// Re-check /auth/me on every route change. Cached success from the previous
// page must not let Modules/Security render while maintenance is on.
export function useConfirmOrgSession(enabled: boolean) {
  const pathname = usePathname();
  const { isSuccess } = useOrgMeQuery(pathname, { skip: !enabled });
  return enabled && isSuccess;
}

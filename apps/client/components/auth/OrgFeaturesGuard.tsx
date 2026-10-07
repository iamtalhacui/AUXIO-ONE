"use client";

import type { ReactNode } from "react";
import { OrgAuthGuard } from "@/components/auth/OrgAuthGuard";

/** Shared feature routes — any authenticated org user; page ACL is per-route. */
export function OrgFeaturesGuard({ children }: { children: ReactNode }) {
  return <OrgAuthGuard>{children}</OrgAuthGuard>;
}

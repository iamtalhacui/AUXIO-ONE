import type { ReactNode } from "react";
import { OrgFeaturesGuard } from "@/components/auth/OrgFeaturesGuard";

export default function FeaturesLayout({ children }: { children: ReactNode }) {
  return <OrgFeaturesGuard>{children}</OrgFeaturesGuard>;
}

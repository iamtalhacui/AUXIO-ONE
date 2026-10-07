"use client";

import type { ActionPermission, PagePermission } from "@/lib/dashboard/content/org-admin-roles";
import { useAppSelector } from "@/lib/store/hooks";

export function useHasPage(page: PagePermission): boolean {
  const user = useAppSelector((s) => s.orgAuth.user);
  const permissions = useAppSelector((s) => s.orgAuth.permissions);
  if (user?.role === "ORG_ADMIN") return true;
  return Boolean(permissions?.pages?.[page]);
}

export function useHasAction(action: ActionPermission): boolean {
  const user = useAppSelector((s) => s.orgAuth.user);
  const permissions = useAppSelector((s) => s.orgAuth.permissions);
  if (user?.role === "ORG_ADMIN") return true;
  return Boolean(permissions?.actions?.[action]);
}

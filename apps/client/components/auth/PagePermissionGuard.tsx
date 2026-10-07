"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PagePermission } from "@/lib/dashboard/content/org-admin-roles";
import { getDashboardHomeForRole } from "@/lib/dashboard/roles";
import { useAppSelector } from "@/lib/store/hooks";

export function PagePermissionGuard({
  page,
  children,
}: {
  page: PagePermission;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAppSelector((state) => state.orgAuth.user);
  const permissions = useAppSelector((state) => state.orgAuth.permissions);

  const allowed =
    user?.role === "ORG_ADMIN" ||
    Boolean(permissions?.pages?.[page]);

  useEffect(() => {
    if (user && permissions && !allowed) {
      router.replace(getDashboardHomeForRole(user.role));
    }
  }, [allowed, permissions, router, user]);

  if (!user || !permissions || !allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}

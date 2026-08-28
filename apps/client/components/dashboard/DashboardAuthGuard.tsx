"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  getDashboardConfigForPath,
  getDashboardConfigForRole,
} from "@/lib/dashboard/config";
import { getDashboardHomeForRole, isUserRole } from "@/lib/dashboard/roles";
import { useAppSelector } from "@/lib/store/hooks";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user, mustChangePassword } = useAppSelector((state) => state.auth);
  const routeConfig = getDashboardConfigForPath(pathname);
  const userConfig = getDashboardConfigForRole(user?.role);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    if (mustChangePassword) {
      router.replace("/change-password");
      return;
    }

    if (!routeConfig || !isUserRole(user?.role)) {
      router.replace(getDashboardHomeForRole(user?.role));
      return;
    }

    if (user?.role !== routeConfig.role) {
      router.replace(getDashboardHomeForRole(user?.role));
    }
  }, [accessToken, mustChangePassword, routeConfig, router, user?.role]);

  if (!accessToken || mustChangePassword) return null;
  if (!routeConfig || !userConfig) return null;
  if (user?.role !== routeConfig.role) return null;

  return children;
}

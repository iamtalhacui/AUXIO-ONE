"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  getDashboardConfigForPath,
  getDashboardConfigForRole,
} from "@/lib/dashboard/config";
import { getDashboardHomeForRole, isUserRole } from "@/lib/dashboard/roles";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { useAppSelector } from "@/lib/store/hooks";
import { DashboardBootScreen } from "@/components/dashboard/DashboardBootScreen";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const mounted = useHasMounted();
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user, mustChangePassword } = useAppSelector((state) => state.auth);
  const routeConfig = getDashboardConfigForPath(pathname);
  const userConfig = getDashboardConfigForRole(user?.role);

  useEffect(() => {
    if (!mounted) return;

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
  }, [mounted, accessToken, mustChangePassword, routeConfig, router, user?.role]);

  if (!mounted) {
    return <DashboardBootScreen />;
  }

  if (!accessToken || mustChangePassword) {
    return <DashboardBootScreen />;
  }

  if (!routeConfig || !userConfig) {
    return <DashboardBootScreen />;
  }

  if (user?.role !== routeConfig.role) {
    return <DashboardBootScreen />;
  }

  return children;
}

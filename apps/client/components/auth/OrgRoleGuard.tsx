"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardHomeForRole } from "@/lib/dashboard/roles";
import { useAppSelector } from "@/lib/store/hooks";

export function OrgRoleGuard({
  allow,
  children,
}: {
  allow: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAppSelector((state) => state.orgAuth.user);

  useEffect(() => {
    if (user && !allow.includes(user.role)) {
      router.replace(getDashboardHomeForRole(user.role));
    }
  }, [allow, router, user]);

  if (!user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConfirmOrgSession } from "@/components/auth/useConfirmOrgSession";
import { needsPlatformApproval } from "@/lib/dashboard/roles";
import { useAppSelector } from "@/lib/store/hooks";

export function OrgAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const hydrated = useAppSelector((state) => state.orgAuth.hydrated);
  const user = useAppSelector((state) => state.orgAuth.user);
  const sessionOk = useConfirmOrgSession(hydrated && Boolean(accessToken));

  useEffect(() => {
    if (hydrated && !accessToken) router.replace("/login");
  }, [accessToken, hydrated, router]);

  useEffect(() => {
    if (!sessionOk || !user) return;
    if (needsPlatformApproval(user) && pathname !== "/platform-approval") {
      router.replace("/platform-approval");
    }
  }, [pathname, router, sessionOk, user]);

  if (!hydrated || !accessToken || !sessionOk) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Checking session…
      </div>
    );
  }

  if (needsPlatformApproval(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}

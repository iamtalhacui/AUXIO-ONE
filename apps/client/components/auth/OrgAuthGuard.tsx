"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfirmOrgSession } from "@/components/auth/useConfirmOrgSession";
import { useAppSelector } from "@/lib/store/hooks";

export function OrgAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const hydrated = useAppSelector((state) => state.orgAuth.hydrated);
  const sessionOk = useConfirmOrgSession(hydrated && Boolean(accessToken));

  useEffect(() => {
    if (hydrated && !accessToken) router.replace("/login");
  }, [accessToken, hydrated, router]);

  if (!hydrated || !accessToken || !sessionOk) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}

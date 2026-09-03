"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";

export function OrgAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";

export function PlatformAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.platformAuth.accessToken);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/platform/login");
    }
  }, [accessToken, router]);

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}

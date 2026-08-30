"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDashboardHomeForRole } from "@/lib/dashboard/roles";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { useAppSelector } from "@/lib/store/hooks";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export function ChangePasswordGuard({ children }: { children: React.ReactNode }) {
  const mounted = useHasMounted();
  const router = useRouter();
  const { accessToken, mustChangePassword, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!mounted) return;

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    if (!mustChangePassword) {
      router.replace(getDashboardHomeForRole(user?.role));
    }
  }, [mounted, accessToken, mustChangePassword, router, user?.role]);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!accessToken || !mustChangePassword) {
    return <div className="min-h-screen bg-background" />;
  }

  return children;
}

export function ChangePasswordPage() {
  return (
    <ChangePasswordGuard>
      <ChangePasswordForm />
    </ChangePasswordGuard>
  );
}

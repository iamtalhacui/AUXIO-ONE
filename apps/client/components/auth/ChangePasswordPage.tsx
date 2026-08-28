"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDashboardHomeForRole } from "@/lib/dashboard/roles";
import { useAppSelector } from "@/lib/store/hooks";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export function ChangePasswordGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, mustChangePassword, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    if (!mustChangePassword) {
      router.replace(getDashboardHomeForRole(user?.role));
    }
  }, [accessToken, mustChangePassword, router, user?.role]);

  if (!accessToken || !mustChangePassword) return null;

  return children;
}

export function ChangePasswordPage() {
  return (
    <ChangePasswordGuard>
      <ChangePasswordForm />
    </ChangePasswordGuard>
  );
}

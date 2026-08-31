"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PendingApprovalView } from "@/components/onboarding/PendingApprovalView";
import { WorkerOnboardingFlow } from "@/components/onboarding/WorkerOnboardingFlow";
import {
  getWorkforceLifecyclePath,
  isWorkforceOperationalStatus,
} from "@/lib/dashboard/user-lifecycle";
import { getDashboardHomeForRole } from "@/lib/dashboard/roles";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { useAppSelector } from "@/lib/store/hooks";

export function OnboardingPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const { accessToken, mustChangePassword, user } = useAppSelector((state) => state.auth);

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

    if (isWorkforceOperationalStatus(user?.status)) {
      router.replace(getDashboardHomeForRole(user?.role));
      return;
    }

    if (user?.status === "SUBMITTED") {
      router.replace("/pending-approval");
    }
  }, [mounted, accessToken, mustChangePassword, router, user?.role, user?.status]);

  if (!mounted || !accessToken) {
    return <div className="min-h-screen bg-background" />;
  }

  if (getWorkforceLifecyclePath(user?.role, user?.status) !== "/onboarding") {
    return <div className="min-h-screen bg-background" />;
  }

  return <WorkerOnboardingFlow />;
}

export function PendingApprovalPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const { accessToken, mustChangePassword, user } = useAppSelector(
    (state) => state.auth,
  );

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

    const lifecyclePath = getWorkforceLifecyclePath(user?.role, user?.status);
    if (lifecyclePath === "/onboarding") {
      router.replace("/onboarding");
      return;
    }

    if (isWorkforceOperationalStatus(user?.status)) {
      router.replace(getDashboardHomeForRole(user?.role));
    }
  }, [
    mounted,
    accessToken,
    mustChangePassword,
    router,
    user?.role,
    user?.status,
  ]);

  if (!mounted || !accessToken) {
    return <div className="min-h-screen bg-background" />;
  }

  if (user?.status !== "SUBMITTED") {
    return <div className="min-h-screen bg-background" />;
  }

  return <PendingApprovalView />;
}

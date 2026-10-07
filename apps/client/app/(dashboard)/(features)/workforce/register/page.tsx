"use client";

import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { RegisterTeamMemberForm } from "@/components/org-admin/RegisterTeamMemberForm";
import { useHasAction } from "@/lib/permissions/hooks";
import { getDashboardHomeForRole } from "@/lib/dashboard/roles";
import { useAppSelector } from "@/lib/store/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function RegisterGate() {
  const canRegister = useHasAction("REGISTER_TEAM_MEMBERS");
  const role = useAppSelector((s) => s.orgAuth.user?.role);
  const router = useRouter();

  useEffect(() => {
    if (!canRegister) {
      router.replace(getDashboardHomeForRole(role));
    }
  }, [canRegister, role, router]);

  if (!canRegister) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Checking access…
      </div>
    );
  }

  return <RegisterTeamMemberForm returnTo="/workforce" />;
}

export default function WorkforceRegisterPage() {
  return (
    <PagePermissionGuard page="WORKFORCE">
      <RegisterGate />
    </PagePermissionGuard>
  );
}

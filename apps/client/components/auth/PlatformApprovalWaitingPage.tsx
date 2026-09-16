"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfirmOrgSession } from "@/components/auth/useConfirmOrgSession";
import { useOrgMeQuery } from "@/lib/api/authApi";
import {
  getDashboardHomeForRole,
  needsPlatformApproval,
} from "@/lib/dashboard/roles";
import { logoutOrg } from "@/lib/store/orgAuthSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

export function PlatformApprovalWaitingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const hydrated = useAppSelector((state) => state.orgAuth.hydrated);
  const user = useAppSelector((state) => state.orgAuth.user);
  const organisation = useAppSelector((state) => state.orgAuth.organisation);
  const sessionOk = useConfirmOrgSession(hydrated && Boolean(accessToken));

  // Poll until Super Admin approves.
  useOrgMeQuery("platform-approval", {
    skip: !hydrated || !accessToken,
    pollingInterval: 12_000,
  });

  useEffect(() => {
    if (hydrated && !accessToken) router.replace("/login");
  }, [accessToken, hydrated, router]);

  useEffect(() => {
    if (!sessionOk || !user) return;
    if (!needsPlatformApproval(user)) {
      router.replace(getDashboardHomeForRole(user.role));
    }
  }, [router, sessionOk, user]);

  if (!hydrated || !accessToken || !sessionOk || !user || !needsPlatformApproval(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Checking approval status…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Platform review
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Waiting for Super Admin approval
        </h1>
        <p className="mt-3 text-sm text-muted">
          Your password is set for {user.email}
          {organisation?.name ? ` at ${organisation.name}` : ""}. A Super Admin must approve
          this organisation admin account before you can use AUXIO One.
        </p>
        <p className="mt-6 text-sm text-muted">This page refreshes automatically.</p>
        <button
          type="button"
          className="btn-secondary mt-8"
          onClick={() => {
            dispatch(logoutOrg());
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

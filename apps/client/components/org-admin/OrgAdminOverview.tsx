"use client";

import Link from "next/link";
import { mockEntitlements, mockUser } from "@/lib/mocks/data";

export function OrgAdminOverview() {
  const enabledCount = mockEntitlements.filter((module) => module.enabled).length;
  const ceilingCount = mockEntitlements.length;

  return (
    <div className="space-y-6">
      <div className="dashboard-card p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Org Admin</p>
        <h1 className="mt-3 text-2xl font-semibold">Welcome, {mockUser.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Manage your organisation workspace. Open configuration to update branding, enable modules, or change your password.
        </p>
        <Link
          href="/org-admin/settings/organisation"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-light"
        >
          Open configuration
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="dashboard-card p-6">
          <p className="text-sm text-muted">Modules in ceiling</p>
          <p className="mt-2 text-3xl font-semibold">{ceilingCount}</p>
        </div>
        <div className="dashboard-card p-6">
          <p className="text-sm text-muted">Modules enabled</p>
          <p className="mt-2 text-3xl font-semibold">{enabledCount}</p>
        </div>
      </div>
    </div>
  );
}

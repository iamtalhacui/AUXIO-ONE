"use client";

import Link from "next/link";
import { featuredWorkflow } from "@/lib/dashboard/content/super-admin";
import { useAppSelector } from "@/lib/store/hooks";

export function WelcomeBanner() {
  const user = useAppSelector((state) => state.platformAuth.user);

  return (
    <div className="dashboard-card p-6">
      <p className="text-sm text-muted">Welcome back</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{user?.name ?? "Super Admin"}</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Register organisations, assign a plan, and invite the first Organisation Admin.
      </p>
      <Link href="/super-admin/organisations/new" className="btn-primary mt-5">
        Register organisation
      </Link>
    </div>
  );
}

export function FeaturedWorkflowCard() {
  return (
    <div className="dashboard-card p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{featuredWorkflow.tag}</p>
      <h2 className="mt-2 text-lg font-semibold">{featuredWorkflow.title}</h2>
      <p className="mt-2 text-sm text-muted">{featuredWorkflow.description}</p>
      <Link href={featuredWorkflow.href} className="mt-4 inline-flex text-sm font-medium text-primary">
        {featuredWorkflow.cta} →
      </Link>
    </div>
  );
}

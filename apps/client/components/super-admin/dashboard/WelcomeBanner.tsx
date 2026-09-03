"use client";

import Link from "next/link";
import { featuredWorkflow } from "@/lib/dashboard/content/super-admin";
import { mockUser } from "@/lib/mocks/data";

export function WelcomeBanner() {
  return (
    <div className="dashboard-card relative overflow-hidden bg-[linear-gradient(135deg,#1f2937_0%,#115e59_55%,#0f766e_100%)] p-6 text-white sm:p-8">
      <div className="absolute -right-8 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 right-16 h-28 w-28 rounded-3xl bg-accent/30 rotate-12" />
      <div className="absolute right-8 top-8 hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm md:block">
        <p className="text-xs text-white/70">Module ceiling</p>
        <p className="text-lg font-semibold">9 granted</p>
      </div>

      <div className="relative max-w-xl">
        <p className="text-sm text-white/75">Welcome back 👋</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {mockUser.name}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-7 text-white/80">
          Monitor organisations, module entitlements, and onboarding activity across the
          AUXIO One platform.
        </p>
        <Link
          href="/super-admin/organisations/new"
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:bg-white/90"
        >
          Register organisation
        </Link>
      </div>
    </div>
  );
}

export function FeaturedWorkflowCard() {
  return (
    <div className="dashboard-card relative overflow-hidden bg-[linear-gradient(160deg,#23201c_0%,#115e59_100%)] p-6 text-white">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(circle_at_bottom,rgba(176,125,62,0.45),transparent_70%)]" />
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-light">
        {featuredWorkflow.tag}
      </p>
      <h2 className="mt-3 text-xl font-semibold">{featuredWorkflow.title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/75">{featuredWorkflow.description}</p>
      <Link
        href={featuredWorkflow.href}
        className="relative mt-5 inline-flex text-sm font-semibold text-white underline-offset-4 hover:underline"
      >
        {featuredWorkflow.cta} →
      </Link>
    </div>
  );
}

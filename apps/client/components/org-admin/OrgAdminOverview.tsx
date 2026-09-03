"use client";

import { useOrgMeQuery } from "@/lib/api/authApi";
import { useAppSelector } from "@/lib/store/hooks";

export function OrgAdminOverview() {
  const stored = useAppSelector((state) => state.orgAuth);
  const { data, isLoading, error } = useOrgMeQuery();

  const user = data?.user ?? stored.user;
  const organisation = data?.organisation ?? stored.organisation;

  if (isLoading && !user) {
    return <p className="text-sm text-muted">Loading organisation…</p>;
  }

  if (error && !user) {
    return <p className="text-sm text-red-600">Could not load your organisation.</p>;
  }

  if (!user || !organisation) return null;

  const name = `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-5">
      <div className="dashboard-card p-6">
        <p className="text-sm text-muted">Organisation Admin</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome, {name}</h1>
        <p className="mt-2 text-sm text-muted">{user.email}</p>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-base font-semibold">Organisation</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Name</dt>
            <dd className="mt-1 text-sm font-medium">{organisation.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Plan</dt>
            <dd className="mt-1 text-sm font-medium">{organisation.plan}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Status</dt>
            <dd className="mt-1 text-sm font-medium">{organisation.status}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Timezone</dt>
            <dd className="mt-1 text-sm font-medium">{organisation.timezone}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Contact email</dt>
            <dd className="mt-1 text-sm font-medium">{organisation.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Phone</dt>
            <dd className="mt-1 text-sm font-medium">{organisation.phone || "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

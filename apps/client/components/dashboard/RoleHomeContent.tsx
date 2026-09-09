"use client";

import { useListOrgModulesQuery } from "@/lib/api/authApi";
import { useAppSelector } from "@/lib/store/hooks";

export function RoleHomeContent({ roleLabel }: { roleLabel: string }) {
  const user = useAppSelector((state) => state.orgAuth.user);
  const organisation = useAppSelector((state) => state.orgAuth.organisation);
  const { data: modules = [], isLoading, error } = useListOrgModulesQuery();

  const enabled = modules.filter((mod) => mod.enabled);
  const name = user ? `${user.firstName} ${user.lastName}` : roleLabel;

  if (isLoading && !user) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  if (error && enabled.length === 0) {
    return <p className="text-sm text-red-600">Could not load enabled modules.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-card p-6">
        <p className="text-sm text-muted">{roleLabel}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Welcome, {name}</h1>
        <p className="mt-2 text-sm text-muted">
          {organisation?.name ?? "Your organisation"}
        </p>
      </div>

      <div className="dashboard-card p-6">
        <h2 className="text-base font-semibold">Enabled modules</h2>
        <p className="mt-1 text-sm text-muted">
          These are the modules your organisation admin has turned on. Features for other modules stay hidden until they are enabled.
        </p>

        {enabled.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No modules are enabled yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {enabled.map((mod) => (
              <li key={mod.code} className="rounded-xl border border-border px-4 py-3">
                <p className="text-sm font-semibold">{mod.name}</p>
                <p className="mt-1 text-xs text-muted">{mod.description || mod.code}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

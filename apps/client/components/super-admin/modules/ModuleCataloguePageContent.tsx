"use client";

import { useState } from "react";
import { useListPlatformModulesQuery } from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

export function ModuleCataloguePageContent() {
  const { data: modules = [], isLoading, error } = useListPlatformModulesQuery();
  const [filter, setFilter] = useState<"ALL" | "CORE" | "OPTIONAL">("ALL");

  const filtered = modules.filter((module) => {
    if (filter === "CORE") return module.isCore;
    if (filter === "OPTIONAL") return !module.isCore;
    return true;
  });

  if (isLoading) {
    return <p className="text-sm text-muted">Loading modules…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load the module catalogue.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Total modules</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{modules.length}</p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Core</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {modules.filter((module) => module.isCore).length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Optional</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {modules.filter((module) => !module.isCore).length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "CORE", "OPTIONAL"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              filter === item
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted hover:border-primary/30"
            }`}
          >
            {item === "ALL" ? "All modules" : item === "CORE" ? "Core" : "Optional"}
          </button>
        ))}
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Code</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted">
                    No modules in this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((module) => (
                  <tr key={module.id} className="border-t border-border/60">
                    <td className="px-6 py-4 font-mono text-xs">{module.code}</td>
                    <td className="px-6 py-4 font-medium">{module.name}</td>
                    <td className="px-6 py-4 text-muted">
                      {module.isCore ? "Core" : "Optional"}
                    </td>
                    <td className="px-6 py-4 text-muted">{module.description || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { mockModules } from "@/lib/mocks/data";

const moduleCatalogue = mockModules.map((module, index) => ({
  ...module,
  isOperational: index < 3,
}));

export function ModuleCataloguePageContent() {
  const [filter, setFilter] = useState<"ALL" | "OPERATIONAL" | "PLATFORM">("ALL");

  const filtered = moduleCatalogue.filter((module) => {
    if (filter === "OPERATIONAL") return module.isOperational;
    if (filter === "PLATFORM") return !module.isOperational;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Total modules</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{moduleCatalogue.length}</p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Operational</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {moduleCatalogue.filter((m) => m.isOperational).length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Platform-only</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {moduleCatalogue.filter((m) => !m.isOperational).length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "OPERATIONAL", "PLATFORM"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === item
                ? "bg-primary text-white"
                : "border border-border bg-background text-muted hover:border-primary/30"
            }`}
          >
            {item === "ALL" ? "All modules" : item === "OPERATIONAL" ? "Operational" : "Platform"}
          </button>
        ))}
      </div>

      <div className="dashboard-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#faf9f7] text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Code</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((module) => (
                <tr key={module.code} className="border-t border-border/60">
                  <td className="px-6 py-4 font-mono text-xs">{module.code}</td>
                  <td className="px-6 py-4 font-medium">{module.name}</td>
                  <td className="px-6 py-4 text-muted">
                    {module.isOperational ? "Operational" : "Platform"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

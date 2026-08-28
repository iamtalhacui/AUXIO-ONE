"use client";

import { useState } from "react";
import { moduleCatalogue } from "@/lib/dashboard/content/super-admin";

export function ModuleCataloguePageContent() {
  const [filter, setFilter] = useState<"ALL" | "OPERATIONAL" | "PLATFORM">("ALL");

  const filtered = moduleCatalogue.filter((module) => {
    if (filter === "OPERATIONAL") return module.operational;
    if (filter === "PLATFORM") return !module.operational;
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
            {moduleCatalogue.filter((m) => m.operational).length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Platform-only</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {moduleCatalogue.filter((m) => !m.operational).length}
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
                : "border border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            {item === "ALL" ? "All modules" : item.charAt(0) + item.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((module) => (
          <article key={module.code} className="dashboard-card p-5 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold text-primary">{module.code}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  module.operational
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-muted text-muted"
                }`}
              >
                {module.operational ? "Operational" : "Platform"}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold">{module.name}</h3>
            <p className="mt-2 text-sm text-muted">
              {module.operational
                ? "Can be granted in an organisation module ceiling."
                : "Platform-level module — not part of tenant ceiling toggles."}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

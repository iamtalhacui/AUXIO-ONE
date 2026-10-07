"use client";

import Link from "next/link";
import type { ManagerOverview } from "@/lib/api/types";

type CustomerStatCardsProps = {
  kpis: ManagerOverview["kpis"];
  customerJoinsLast14Days: ManagerOverview["customerJoinsLast14Days"];
  modules: ManagerOverview["modules"];
};

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);

  if (points.every((p) => p === 0)) return null;

  return (
    <div className="flex h-8 items-end gap-0.5" aria-hidden="true">
      {points.map((value, index) => (
        <div
          key={index}
          className="w-1 rounded-full bg-primary/70"
          style={{ height: `${Math.max((value / max) * 100, value > 0 ? 15 : 4)}%` }}
        />
      ))}
    </div>
  );
}

export function CustomerStatCards({
  kpis,
  customerJoinsLast14Days,
  modules,
}: CustomerStatCardsProps) {
  const sparkline = customerJoinsLast14Days.map((d) => d.count);

  return (
    <div className="flex flex-col gap-5">
      <article className="dashboard-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Customers</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {modules.customersEnabled ? kpis.customersTotal : "—"}
            </p>
          </div>
          {modules.customersEnabled ? <Sparkline points={sparkline} /> : null}
        </div>
        <p className="mt-2 text-xs text-muted">
          {modules.customersEnabled
            ? `${kpis.customersActive} active`
            : "Customers module off"}
        </p>
      </article>

      <article className="dashboard-card p-5">
        <p className="text-sm text-muted">Awaiting action</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{kpis.awaitingAction}</p>
        <p
          className={`mt-2 text-xs ${
            kpis.awaitingAction > 0 ? "font-semibold text-amber-700" : "font-semibold text-primary"
          }`}
        >
          Activate + docs + follow-ups
        </p>
      </article>

      <Link
        href="/crm"
        className="dashboard-card block p-5 transition hover:border-primary/40"
      >
        <p className="text-sm text-muted">Open pipeline</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {modules.crmEnabled ? kpis.openPipelineCount : "—"}
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">
          {modules.crmEnabled ? "Open CRM →" : "CRM module off"}
        </p>
      </Link>
    </div>
  );
}

import { overviewStats } from "@/lib/dashboard/content/super-admin";

function MiniBars({ bars }: { bars: readonly number[] }) {
  const max = Math.max(...bars);

  return (
    <div className="flex h-16 items-end gap-1">
      {bars.map((value, index) => (
        <div
          key={index}
          className="w-2 rounded-full bg-primary/80"
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function OverviewStatCards() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {overviewStats.map((stat) => (
        <article key={stat.label} className="dashboard-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-2 flex items-center gap-2 text-xs">
                <span
                  className={`font-semibold ${stat.positive ? "text-primary" : "text-accent"}`}
                >
                  {stat.change}
                </span>
                <span className="text-muted">{stat.changeLabel}</span>
              </p>
            </div>
            <MiniBars bars={stat.bars} />
          </div>
        </article>
      ))}
    </div>
  );
}

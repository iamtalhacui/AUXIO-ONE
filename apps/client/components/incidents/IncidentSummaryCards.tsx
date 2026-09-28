"use client";

type Summary = {
  total: number;
  pendingReview: number;
  underReview: number;
  actionRequired: number;
  resolved: number;
  highCritical: number;
};

type Props = {
  summary: Summary;
  onSelectStatus?: (
    status: "" | "PENDING_REVIEW" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "RESOLVED" | "CLOSED",
  ) => void;
};

export function IncidentSummaryCards({ summary, onSelectStatus }: Props) {
  const cards = [
    { key: "total" as const, label: "Total incidents", value: summary.total, filter: "" as const },
    {
      key: "pending",
      label: "Pending review",
      value: summary.pendingReview,
      filter: "PENDING_REVIEW" as const,
      tone: summary.pendingReview > 0 ? "warn" : undefined,
    },
    {
      key: "under",
      label: "Under review",
      value: summary.underReview,
      filter: "UNDER_REVIEW" as const,
    },
    {
      key: "action",
      label: "Action required",
      value: summary.actionRequired,
      filter: "ACTION_REQUIRED" as const,
      tone: summary.actionRequired > 0 ? "warn" : undefined,
    },
    { key: "resolved", label: "Resolved", value: summary.resolved, filter: "RESOLVED" as const },
    {
      key: "high",
      label: "High / critical",
      value: summary.highCritical,
      filter: "" as const,
      tone: summary.highCritical > 0 ? "danger" : undefined,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const interactive = Boolean(onSelectStatus) && card.key !== "high";
        const className = [
          "dashboard-card px-4 py-4 text-left transition",
          interactive ? "hover:border-primary/40" : "",
          card.tone === "warn" ? "border-amber-200/80" : "",
          card.tone === "danger" ? "border-red-200/80" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const body = (
          <>
            <p className="text-sm text-muted">{card.label}</p>
            <p
              className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
                card.tone === "danger"
                  ? "text-red-700"
                  : card.tone === "warn"
                    ? "text-amber-800"
                    : "text-foreground"
              }`}
            >
              {card.value}
            </p>
          </>
        );

        if (!interactive) {
          return (
            <article key={card.key} className={className}>
              {body}
            </article>
          );
        }

        return (
          <button
            key={card.key}
            type="button"
            className={className}
            onClick={() => onSelectStatus?.(card.filter)}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

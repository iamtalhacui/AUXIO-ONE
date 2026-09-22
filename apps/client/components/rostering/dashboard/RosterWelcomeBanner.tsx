"use client";

import Link from "next/link";
import { useAppSelector } from "@/lib/store/hooks";
import type { RosterOverview } from "@/lib/api/types";
import { formatLongDate } from "@/lib/rostering/format";

const QUICK_ACTIONS = [
  { label: "Open schedule", href: "/roster/schedule", primary: true },
  { label: "Matching", href: "/roster/matching", primary: false },
  { label: "Your profile", href: "/roster/profile", primary: false },
] as const;

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type RosterWelcomeBannerProps = {
  organisation: RosterOverview["organisation"];
  today: string;
};

export function RosterWelcomeBanner({ organisation, today }: RosterWelcomeBannerProps) {
  const user = useAppSelector((state) => state.orgAuth.user);
  const greeting = greetingForHour(new Date().getHours());
  const name = user ? `${user.firstName} ${user.lastName}` : "Rostering Expert";

  return (
    <div className="dashboard-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{greeting}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            {organisation.name} · {formatLongDate(today)} — fill gaps and keep offers moving.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={action.primary ? "btn-primary" : "btn-secondary"}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

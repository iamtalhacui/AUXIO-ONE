"use client";

import { useGetMaintenanceStatusQuery } from "@/lib/api/authApi";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";

function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Advance notice (and active notice) for organisation portals.
 * Hidden on Super Admin routes — parent should skip mounting there.
 */
export function MaintenanceBanner() {
  const { data } = useGetMaintenanceStatusQuery(undefined, {
    pollingInterval: LIVE_POLL_MS.lists,
  });

  if (!data || (!data.upcoming && !data.active)) return null;

  const start = formatWhen(data.startsAt);
  const end = formatWhen(data.endsAt);
  const windowText =
    start && end
      ? `${start} → ${end}`
      : start
        ? `from ${start}`
        : null;

  const tone = data.active
    ? "border-red-200 bg-red-50 text-red-950"
    : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <p className="font-semibold">
        {data.active ? "Platform maintenance in progress" : "Upcoming platform maintenance"}
      </p>
      {windowText ? <p className="mt-1 opacity-90">{windowText}</p> : null}
      {data.message ? <p className="mt-1 opacity-90">{data.message}</p> : null}
      {!data.message && data.upcoming ? (
        <p className="mt-1 opacity-90">
          Organisation access may be unavailable during this window. Adjust your work
          accordingly.
        </p>
      ) : null}
    </div>
  );
}

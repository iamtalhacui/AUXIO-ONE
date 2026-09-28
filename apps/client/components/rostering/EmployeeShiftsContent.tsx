"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NowStrip } from "@/components/rostering/employee/NowStrip";
import { ShiftListRow } from "@/components/rostering/employee/ShiftListRow";
import {
  useAcceptShiftOfferMutation,
  useDeclineShiftOfferMutation,
  useListMyShiftsQuery,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import { useToast } from "@/components/toast/ToastProvider";
import { useNowTick } from "@/lib/rostering/useShiftClock";
import type { ScheduleShift } from "@/lib/api/types";
import { formatDayHeading, todayIso } from "@/lib/rostering/format";

type Tab = "needsYou" | "upcoming" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "needsYou", label: "Needs you" },
  { id: "upcoming", label: "Upcoming" },
  { id: "history", label: "History" },
];

const EMPTY_COPY: Record<Tab, string> = {
  needsYou: "Nothing needs your attention right now.",
  upcoming: "No shifts assigned yet. Your rostering team will offer shifts here.",
  history: "Completed shifts will appear here once you finish them.",
};

function sortAscending(a: ScheduleShift, b: ScheduleShift) {
  return `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`);
}

function sortDescending(a: ScheduleShift, b: ScheduleShift) {
  return `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`);
}

/** Groups a sorted list into date sections so "Today" reads as a heading, not a tab. */
function groupByDate(shifts: ScheduleShift[]) {
  const groups: { date: string; shifts: ScheduleShift[] }[] = [];
  for (const shift of shifts) {
    const last = groups[groups.length - 1];
    if (last && last.date === shift.date) last.shifts.push(shift);
    else groups.push({ date: shift.date, shifts: [shift] });
  }
  return groups;
}

export function EmployeeShiftsContent() {
  const { toast } = useToast();
  const {
    data: shifts = [],
    isLoading,
    error,
    refetch,
  } = useListMyShiftsQuery(undefined, { pollingInterval: LIVE_POLL_MS.lists });
  const [accept, acceptState] = useAcceptShiftOfferMutation();
  const [decline, declineState] = useDeclineShiftOfferMutation();
  const [tab, setTab] = useState<Tab>("needsYou");
  const [actionError, setActionError] = useState("");
  const now = useNowTick(1000);
  const today = todayIso();

  const lists = useMemo(() => {
    const offers = shifts.filter((s) => s.status === "OFFERED").sort(sortAscending);
    const inProgress = shifts.filter((s) => s.status === "IN_PROGRESS").sort(sortAscending);
    const rejected = shifts.filter((s) => s.status === "REJECTED").sort(sortDescending);

    const upcoming = shifts
      .filter((s) => s.status === "ACCEPTED" && s.date >= today)
      .sort(sortAscending);

    const history = shifts
      .filter(
        (s) =>
          s.status === "APPROVED" ||
          s.status === "PENDING_APPROVAL" ||
          s.status === "REJECTED" ||
          (s.status === "ACCEPTED" && s.date < today),
      )
      .sort(sortDescending);

    return {
      offers,
      needsYou: [...inProgress, ...offers, ...rejected],
      upcoming: [...inProgress.filter((s) => s.date >= today), ...upcoming].sort(sortAscending),
      history,
    };
  }, [shifts, today]);

  /** The active shift wins the Now strip; otherwise show whatever is soonest. */
  const focusShift = useMemo(() => {
    const active = shifts.find((s) => s.status === "IN_PROGRESS");
    if (active) return active;
    return (
      shifts
        .filter((s) => s.status === "ACCEPTED" && s.date >= today)
        .sort(sortAscending)[0] ?? null
    );
  }, [shifts, today]);

  const busy = acceptState.isLoading || declineState.isLoading;

  async function respond(id: string, action: "accept" | "decline") {
    setActionError("");
    try {
      if (action === "accept") await accept(id).unwrap();
      else await decline(id).unwrap();
      toast({
        variant: action === "accept" ? "success" : "info",
        title: action === "accept" ? "Shift accepted" : "Shift declined",
        description:
          action === "accept"
            ? "It is now in your upcoming shifts."
            : "It has gone back to the rostering team.",
      });
      void refetch();
    } catch (err) {
      const message = getErrorMessage(err, "Could not update offer");
      setActionError(message);
      toast({ variant: "error", title: "Could not update offer", description: message });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="My shifts" description="Loading your roster…" />
        <div className="dashboard-card h-28 animate-pulse" />
        <div className="dashboard-card h-64 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="My shifts" />
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getErrorMessage(error, "Could not load shifts.")}
        </p>
      </div>
    );
  }

  const items = lists[tab];
  const groups = tab === "needsYou" ? null : groupByDate(items);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My shifts"
        description="Your roster, offers and shift history."
      />

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </p>
      ) : null}

      <NowStrip
        shift={focusShift}
        now={now}
        offersCount={lists.offers.length}
        onViewOffers={() => setTab("needsYou")}
      />

      <div className="dashboard-card overflow-hidden">
        <div className="tab-bar pt-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`tab-item ${tab === t.id ? "tab-item-active" : ""}`}
            >
              {t.label}
              {lists[t.id].length > 0 ? (
                <span className="tab-count">{lists[t.id].length}</span>
              ) : null}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted">{EMPTY_COPY[tab]}</p>
        ) : groups ? (
          <div>
            {groups.map((group) => (
              <div key={group.date}>
                <p className="sticky top-0 z-10 border-y border-border/40 bg-surface-subtle px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {formatDayHeading(group.date)}
                </p>
                <ul className="divide-y divide-border/40">
                  {group.shifts.map((shift) => (
                    <ShiftListRow key={shift.id} shift={shift} now={now} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {items.map((shift) => (
              <ShiftListRow
                key={shift.id}
                shift={shift}
                now={now}
                showDate
                busy={busy}
                onAccept={(id) => void respond(id, "accept")}
                onDecline={(id) => void respond(id, "decline")}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

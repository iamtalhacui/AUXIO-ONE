"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  useAcceptShiftOfferMutation,
  useDeclineShiftOfferMutation,
  useListMyShiftsQuery,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import {
  formatDuration,
  formatLongDate,
  formatShiftTime,
  todayIso,
} from "@/lib/rostering/format";

type Tab = "upcoming" | "today" | "past" | "offers";

export function EmployeeShiftsContent() {
  const { data: shifts = [], isLoading, error, refetch } = useListMyShiftsQuery();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [accept, acceptState] = useAcceptShiftOfferMutation();
  const [decline, declineState] = useDeclineShiftOfferMutation();
  const [actionError, setActionError] = useState("");
  const today = todayIso();

  const lists = useMemo(() => {
    const offers = shifts.filter((s) => s.status === "OFFERED");
    const assigned = shifts.filter(
      (s) =>
        s.status === "ACCEPTED" ||
        s.status === "IN_PROGRESS" ||
        s.status === "PENDING_APPROVAL" ||
        s.status === "APPROVED" ||
        s.status === "REJECTED",
    );
    return {
      offers,
      today: assigned.filter((s) => s.date === today),
      upcoming: assigned
        .filter((s) => s.date >= today && s.status !== "APPROVED" && s.status !== "REJECTED")
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
      past: assigned
        .filter((s) => s.date < today || s.status === "APPROVED" || s.status === "REJECTED")
        .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)),
    };
  }, [shifts, today]);

  const items = lists[tab];
  const busy = acceptState.isLoading || declineState.isLoading;

  async function respond(id: string, action: "accept" | "decline") {
    setActionError("");
    try {
      if (action === "accept") await accept(id).unwrap();
      else await decline(id).unwrap();
      void refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not update offer"));
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "offers", label: "Offers" },
    { id: "upcoming", label: "Upcoming" },
    { id: "today", label: "Today" },
    { id: "past", label: "Past" },
  ];

  if (isLoading) return <p className="text-sm text-muted">Loading shifts…</p>;
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load shifts.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="My shifts"
        description="Assigned shifts and offers from your rostering team."
      />

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <div className="dashboard-card">
        <div className="tab-bar">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`tab-item ${tab === t.id ? "tab-item-active" : ""}`}
            >
              {t.label}
              <span className="tab-count">{lists[t.id].length}</span>
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {tab === "offers"
              ? "No pending shift offers."
              : tab === "upcoming"
                ? "No shifts assigned yet."
                : tab === "today"
                  ? "Nothing scheduled for today."
                  : "No past shifts yet."}
          </p>
        ) : tab === "offers" ? (
          <ul className="divide-y divide-border/40">
            {lists.offers.map((shift) => (
              <li key={shift.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{shift.participantName}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatLongDate(shift.date)} ·{" "}
                      {formatShiftTime(shift.startTime, shift.endTime)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {shift.locationLabel} · {shift.serviceTitle} ·{" "}
                      {formatDuration(shift.durationMinutes)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ShiftStatusPill status={shift.status} />
                    <button
                      type="button"
                      className="btn-secondary !rounded-lg !px-3 !py-2"
                      disabled={busy}
                      onClick={() => void respond(shift.id, "decline")}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="btn-primary !px-3 !py-2"
                      disabled={busy}
                      onClick={() => void respond(shift.id, "accept")}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-border/40">
            {items.map((shift) => (
              <li key={shift.id}>
                <Link
                  href={`/employee/shifts/${shift.id}`}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[#fafbfc] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">{shift.participantName}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatLongDate(shift.date)} ·{" "}
                      {formatShiftTime(shift.startTime, shift.endTime)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {shift.locationLabel} · {shift.serviceTitle} ·{" "}
                      {formatDuration(shift.durationMinutes)}
                    </p>
                  </div>
                  <ShiftStatusPill status={shift.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

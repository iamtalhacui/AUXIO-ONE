"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import {
  DEMO_DATE,
  DEMO_EMPLOYEE_WORKER_ID,
  formatShiftTime,
} from "@/lib/rostering/mock-data";
import {
  acceptShiftOffer,
  declineShiftOffer,
  useRosterShifts,
} from "@/lib/rostering/store";

type Tab = "upcoming" | "today" | "past" | "offers";

function formatLongDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function EmployeeShiftsContent() {
  const shifts = useRosterShifts();
  const [tab, setTab] = useState<Tab>("upcoming");

  const mine = useMemo(
    () => shifts.filter((s) => s.workerId === DEMO_EMPLOYEE_WORKER_ID),
    [shifts],
  );

  const offers = useMemo(
    () =>
      shifts.filter(
        (s) => s.offeredWorkerId === DEMO_EMPLOYEE_WORKER_ID && s.status === "OFFERED",
      ),
    [shifts],
  );

  const lists = {
    today: mine.filter((s) => s.date === DEMO_DATE),
    upcoming: mine
      .filter((s) => s.date >= DEMO_DATE && s.status !== "COMPLETED")
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
    past: mine
      .filter((s) => s.date < DEMO_DATE || s.status === "COMPLETED")
      .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)),
    offers,
  };

  const items = lists[tab];

  const tabs: { id: Tab; label: string }[] = [
    { id: "offers", label: "Offers" },
    { id: "upcoming", label: "Upcoming" },
    { id: "today", label: "Today" },
    { id: "past", label: "Past" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="My shifts"
        description="Assigned shifts and offers from your rostering team."
      />

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
                  : "No past shifts in the demo set."}
          </p>
        ) : tab === "offers" ? (
          <ul className="divide-y divide-border/40">
            {offers.map((shift) => (
              <li key={shift.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{shift.participantName}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatLongDate(shift.date)} ·{" "}
                      {formatShiftTime(shift.startTime, shift.endTime)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {shift.locationLabel} · {shift.serviceTitle} · {shift.durationHours}h
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ShiftStatusPill status={shift.status} />
                    <button
                      type="button"
                      className="btn-secondary !rounded-lg !px-3 !py-2"
                      onClick={() => declineShiftOffer(shift.id, DEMO_EMPLOYEE_WORKER_ID)}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="btn-primary !px-3 !py-2"
                      onClick={() => acceptShiftOffer(shift.id, DEMO_EMPLOYEE_WORKER_ID)}
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
                      {shift.locationLabel} · {shift.serviceTitle} · {shift.durationHours}h
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

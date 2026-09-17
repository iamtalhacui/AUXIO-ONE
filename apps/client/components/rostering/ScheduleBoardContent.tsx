"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CreateShiftModal } from "@/components/rostering/CreateShiftModal";
import { EditShiftModal } from "@/components/rostering/EditShiftModal";
import { ShiftStatusPill } from "@/components/rostering/ShiftStatusPill";
import { useListScheduleShiftsQuery } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { ScheduleShift } from "@/lib/api/types";
import {
  addDays,
  BOARD_END_HOUR,
  BOARD_START_HOUR,
  formatDuration,
  formatLongDate,
  formatShortDate,
  formatShiftTime,
  parseTimeToMinutes,
  todayIso,
} from "@/lib/rostering/format";

type ViewMode = "table" | "calendar";
type RangeMode = "day" | "week";

const HOURS = Array.from(
  { length: BOARD_END_HOUR - BOARD_START_HOUR },
  (_, i) => BOARD_START_HOUR + i,
);

function workerLabel(shift: ScheduleShift) {
  if (shift.status === "OFFERED" && shift.offeredWorkerName) {
    return `Offered to ${shift.offeredWorkerName}`;
  }
  if (shift.assignedWorkerName) return shift.assignedWorkerName;
  if (shift.status === "DRAFT") return "Draft — not published";
  return "Unfilled";
}

function blockStyle(shift: ScheduleShift) {
  const start = parseTimeToMinutes(shift.startTime);
  const end = parseTimeToMinutes(shift.endTime);
  const boardStart = BOARD_START_HOUR * 60;
  const boardSpan = (BOARD_END_HOUR - BOARD_START_HOUR) * 60;
  const left = ((start - boardStart) / boardSpan) * 100;
  const width = ((end - start) / boardSpan) * 100;
  return { left: `${left}%`, width: `${Math.max(width, 3.5)}%` };
}

function blockTone(shift: ScheduleShift) {
  if (shift.status === "DRAFT") return "border-dashed border-slate-300 bg-slate-50 text-slate-700";
  if (shift.status === "UNFILLED") return "border-dashed border-amber-300 bg-amber-50 text-amber-950";
  if (shift.status === "OFFERED") return "border-sky-200 bg-sky-50 text-sky-900";
  if (shift.status === "ACCEPTED") return "border-primary/25 bg-primary/8 text-primary";
  if (shift.status === "IN_PROGRESS") return "border-violet-200 bg-violet-50 text-violet-900";
  if (shift.status === "PENDING_APPROVAL") return "border-orange-200 bg-orange-50 text-orange-900";
  if (shift.status === "APPROVED") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (shift.status === "REJECTED") return "border-red-200 bg-red-50 text-red-900";
  return "border-border bg-slate-50 text-slate-700";
}

export function ScheduleBoardContent() {
  const [date, setDate] = useState(todayIso());
  const [range, setRange] = useState<RangeMode>("day");
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editShift, setEditShift] = useState<ScheduleShift | null>(null);
  const [flash, setFlash] = useState("");

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(date, i)),
    [date],
  );

  const from = range === "day" ? date : weekDates[0];
  const to = range === "day" ? date : weekDates[6];

  const { data: shifts = [], isLoading, error, refetch } = useListScheduleShiftsQuery({
    from,
    to,
  });

  const visible = useMemo(() => {
    return shifts
      .filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          s.participantName.toLowerCase().includes(q) ||
          s.locationLabel.toLowerCase().includes(q) ||
          s.serviceTitle.toLowerCase().includes(q) ||
          s.serviceLine.toLowerCase().includes(q) ||
          (s.assignedWorkerName ?? "").toLowerCase().includes(q) ||
          (s.offeredWorkerName ?? "").toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
      );
  }, [shifts, search]);

  function onCreated(count: number) {
    setFlash(
      count > 1
        ? `${count} draft shifts created. Publish and offer from Matching.`
        : "Draft shift created. Publish and offer from Matching.",
    );
    window.setTimeout(() => setFlash(""), 4000);
    void refetch();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedule"
        description="Create draft shifts, then publish and offer workers from Matching."
        action={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            + Create Shift
          </button>
        }
      />

      {flash ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {flash}
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(error, "Could not load shifts.")}
        </p>
      ) : null}

      <div className="dashboard-card flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-secondary !rounded-lg !px-3 !py-2"
            onClick={() => setDate((d) => addDays(d, range === "day" ? -1 : -7))}
          >
            ←
          </button>
          <div className="min-w-[12rem] text-center">
            <p className="text-sm font-semibold">
              {range === "day"
                ? formatLongDate(date)
                : `${formatShortDate(weekDates[0])} – ${formatShortDate(weekDates[6])}`}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary !rounded-lg !px-3 !py-2"
            onClick={() => setDate((d) => addDays(d, range === "day" ? 1 : 7))}
          >
            →
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-primary hover:underline"
            onClick={() => setDate(todayIso())}
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={range}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
            ]}
            onChange={setRange}
          />
          <Segmented
            value={view}
            options={[
              { value: "table", label: "Table" },
              { value: "calendar", label: "Calendar" },
            ]}
            onChange={setView}
          />
        </div>

        <div className="search-input-wrap w-full sm:max-w-xs sm:flex-1">
          <input
            className="search-input"
            placeholder="Search participant, service, worker…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading schedule…</p>
      ) : view === "table" ? (
        <TableView
          shifts={visible}
          showDate={range === "week"}
          onEdit={setEditShift}
        />
      ) : range === "day" ? (
        <DayCalendar shifts={visible} />
      ) : (
        <WeekCalendar
          dates={weekDates}
          shifts={visible}
          onSelectDay={(d) => {
            setDate(d);
            setRange("day");
          }}
        />
      )}

      <CreateShiftModal
        open={createOpen}
        defaultDate={date}
        onClose={() => setCreateOpen(false)}
        onCreated={onCreated}
      />

      <EditShiftModal
        shift={editShift}
        onClose={() => setEditShift(null)}
        onSaved={() => {
          setFlash("Shift updated.");
          window.setTimeout(() => setFlash(""), 2500);
          void refetch();
        }}
      />
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border/60 bg-[#f8fafc] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            value === opt.value
              ? "bg-white text-primary shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TableView({
  shifts,
  showDate,
  onEdit,
}: {
  shifts: ScheduleShift[];
  showDate: boolean;
  onEdit: (shift: ScheduleShift) => void;
}) {
  if (shifts.length === 0) {
    return (
      <div className="dashboard-card px-5 py-12 text-center text-sm text-muted">
        No shifts for this period. Create a draft shift to get started.
      </div>
    );
  }

  return (
    <div className="data-table-wrap overflow-x-auto">
      <table className="data-table min-w-[860px]">
        <thead>
          <tr>
            {showDate ? <th>Date</th> : null}
            <th>Time</th>
            <th>Participant / location</th>
            <th>Service</th>
            <th>Worker</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => (
            <tr key={shift.id}>
              {showDate ? (
                <td className="whitespace-nowrap text-muted">{formatShortDate(shift.date)}</td>
              ) : null}
              <td className="whitespace-nowrap font-medium">
                {formatShiftTime(shift.startTime, shift.endTime)}
                <span className="mt-0.5 block text-xs font-normal text-muted">
                  {formatDuration(shift.durationMinutes)}
                </span>
              </td>
              <td>
                <span className="block text-sm font-medium">{shift.participantName}</span>
                <span className="text-xs text-muted">{shift.locationLabel}</span>
              </td>
              <td>
                <span className="block text-sm">{shift.serviceTitle}</span>
                <span className="text-xs text-muted">{shift.serviceLine}</span>
              </td>
              <td>
                {shift.status === "UNFILLED" ||
                (shift.status === "DRAFT" && !shift.offeredWorkerId) ? (
                  <span className="font-semibold text-amber-800">{workerLabel(shift)}</span>
                ) : (
                  workerLabel(shift)
                )}
              </td>
              <td>
                <ShiftStatusPill status={shift.status} />
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  {shift.status === "DRAFT" ||
                  shift.status === "UNFILLED" ||
                  shift.status === "OFFERED" ? (
                    <Link
                      href={`/roster/matching?shift=${shift.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {shift.status === "OFFERED" ? "View offer" : "Match"}
                    </Link>
                  ) : null}
                  {shift.status !== "APPROVED" &&
                  shift.status !== "REJECTED" &&
                  shift.status !== "CANCELLED" &&
                  shift.status !== "IN_PROGRESS" &&
                  shift.status !== "PENDING_APPROVAL" ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-muted hover:text-primary hover:underline"
                      onClick={() => onEdit(shift)}
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DayCalendar({ shifts }: { shifts: ScheduleShift[] }) {
  return (
    <div className="dashboard-card overflow-hidden">
      <div className="relative border-b border-border/50 bg-[#f8fafc]">
        <div className="flex pl-0">
          {HOURS.map((h) => (
            <div
              key={h}
              className="flex-1 border-r border-border/40 px-1 py-3 text-[10px] font-medium text-muted last:border-r-0"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-h-[220px] p-3">
        {shifts.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">No shifts on this day.</p>
        ) : (
          <div className="relative h-[200px]">
            <div className="pointer-events-none absolute inset-0 flex">
              {HOURS.map((h) => (
                <div key={h} className="flex-1 border-r border-border/30 last:border-r-0" />
              ))}
            </div>
            {shifts.map((shift, index) => {
              const row = index % 3;
              return (
                <div
                  key={shift.id}
                  style={{
                    ...blockStyle(shift),
                    top: `${row * 62 + 8}px`,
                  }}
                  className={`absolute h-14 overflow-hidden rounded-lg border px-2 py-1.5 ${blockTone(shift)}`}
                  title={`${shift.serviceTitle} · ${workerLabel(shift)}`}
                >
                  <p className="truncate text-[11px] font-bold">
                    {shift.startTime}–{shift.endTime}
                  </p>
                  <p className="truncate text-[11px]">{shift.participantName}</p>
                  <p className="truncate text-[10px] opacity-80">{workerLabel(shift)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WeekCalendar({
  dates,
  shifts,
  onSelectDay,
}: {
  dates: string[];
  shifts: ScheduleShift[];
  onSelectDay: (date: string) => void;
}) {
  return (
    <div className="dashboard-card overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7 divide-x divide-border/40">
        {dates.map((d) => {
          const dayShifts = shifts.filter((s) => s.date === d);
          return (
            <div key={d} className="min-h-[280px]">
              <button
                type="button"
                onClick={() => onSelectDay(d)}
                className="w-full border-b border-border/50 bg-[#f8fafc] px-2 py-3 text-left hover:bg-white"
              >
                <p className="text-xs font-semibold text-muted">{formatShortDate(d)}</p>
                <p className="mt-0.5 text-[11px] text-muted">{dayShifts.length} shifts</p>
              </button>
              <ul className="space-y-1.5 p-2">
                {dayShifts.map((s) => (
                  <li
                    key={s.id}
                    className={`rounded-md border px-1.5 py-1.5 text-[10px] ${blockTone(s)}`}
                  >
                    <p className="font-bold">
                      {s.startTime} {s.participantName.split(" ")[0]}
                    </p>
                    <p className="truncate opacity-80">{workerLabel(s)}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

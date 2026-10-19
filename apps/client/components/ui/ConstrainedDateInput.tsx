"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useAnchoredPopover } from "@/components/ui/useAnchoredPopover";
import { todayIso } from "@/lib/rostering/format";

type ConstrainedDateInputProps = {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  className?: string;
  "aria-label"?: string;
};

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(iso: string) {
  if (!iso) return "Select date";
  return parseIso(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function startOfMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  // Monday-first: JS getDay() Sunday=0 → convert
  const weekday = (first.getDay() + 6) % 7;
  const start = new Date(year, monthIndex, 1 - weekday);
  return start;
}

/** Mobile-safe date picker — avoids native date popups that overflow on mobile. */
export function ConstrainedDateInput({
  id,
  value,
  onChange,
  disabled,
  min,
  className = "",
  "aria-label": ariaLabel,
}: ConstrainedDateInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const initial = value ? parseIso(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const box = useAnchoredPopover(open, triggerRef, {
    minWidth: 280,
    maxWidth: 320,
    preferredHeight: 360,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !value) return;
    const d = parseIso(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = useMemo(() => {
    const start = startOfMonthGrid(viewYear, viewMonth);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });

  const minDate = min ? parseIso(min) : null;

  const menu =
    open && box && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="dialog"
            aria-label={ariaLabel ?? "Choose date"}
            className="z-[80] overflow-hidden rounded-xl border border-border/70 bg-surface shadow-xl"
            style={{
              position: "fixed",
              top: box.openUp ? undefined : box.top,
              bottom: box.openUp ? window.innerHeight - box.top + 4 : undefined,
              left: box.left,
              width: box.width,
              maxHeight: box.maxHeight,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
              <button
                type="button"
                className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
                aria-label="Previous month"
                onClick={() => {
                  const d = new Date(viewYear, viewMonth - 1, 1);
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
              <button
                type="button"
                className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
                aria-label="Next month"
                onClick={() => {
                  const d = new Date(viewYear, viewMonth + 1, 1);
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 pb-2 pt-2">
              <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">
                {WEEKDAYS.map((d) => (
                  <span key={d} className="py-1">
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((d) => {
                  const iso = toIso(d);
                  const inMonth = d.getMonth() === viewMonth;
                  const selected = iso === value;
                  const beforeMin = minDate ? d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : false;
                  return (
                    <button
                      key={iso + String(inMonth)}
                      type="button"
                      disabled={beforeMin}
                      onClick={() => {
                        onChange(iso);
                        setOpen(false);
                      }}
                      className={`flex h-9 items-center justify-center rounded-lg text-sm transition ${
                        selected
                          ? "bg-primary font-semibold text-primary-foreground"
                          : beforeMin
                            ? "cursor-not-allowed text-muted/40"
                            : inMonth
                              ? "text-foreground hover:bg-surface-muted"
                              : "text-muted/50 hover:bg-surface-muted"
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/50 px-3 py-2">
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline"
                onClick={() => {
                  const today = todayIso();
                  if (min && today < min) return;
                  onChange(today);
                  setOpen(false);
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="text-sm font-medium text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        className="input-field flex w-full min-w-0 items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="min-w-0 truncate">{formatDisplay(value)}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      </button>
      {menu}
    </div>
  );
}

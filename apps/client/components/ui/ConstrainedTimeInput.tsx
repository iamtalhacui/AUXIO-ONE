"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import { useAnchoredPopover } from "@/components/ui/useAnchoredPopover";

type ConstrainedTimeInputProps = {
  id?: string;
  value: string; // HH:mm 24h
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  /** Minute step (default 5). */
  stepMinutes?: number;
};

function parseHm(value: string) {
  const [hRaw, mRaw] = (value || "09:00").split(":").map(Number);
  const h24 = Number.isFinite(hRaw) ? Math.min(23, Math.max(0, hRaw)) : 9;
  const m = Number.isFinite(mRaw) ? Math.min(59, Math.max(0, mRaw)) : 0;
  return { h24, m };
}

function toHm(h24: number, m: number) {
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDisplay(value: string) {
  const { h24, m } = parseHm(value);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Mobile-safe time picker — avoids native time popups that overflow on mobile. */
export function ConstrainedTimeInput({
  id,
  value,
  onChange,
  disabled,
  className = "",
  "aria-label": ariaLabel,
  stepMinutes = 5,
}: ConstrainedTimeInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const box = useAnchoredPopover(open, triggerRef, {
    minWidth: 260,
    maxWidth: 320,
    preferredHeight: 300,
  });

  const { h24, m } = parseHm(value);
  const period = h24 >= 12 ? "PM" : "AM";
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const minute = Math.round(m / stepMinutes) * stepMinutes % 60;

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: Math.floor(60 / stepMinutes) }, (_, i) => i * stepMinutes);

  useEffect(() => setMounted(true), []);

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

  function commit(nextHour12: number, nextMinute: number, nextPeriod: "AM" | "PM") {
    let h = nextHour12 % 12;
    if (nextPeriod === "PM") h += 12;
    onChange(toHm(h, nextMinute));
  }

  const menu =
    open && box && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="dialog"
            aria-label={ariaLabel ?? "Choose time"}
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
            <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/50 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
              <span className="px-2 py-2">Hour</span>
              <span className="px-2 py-2">Min</span>
              <span className="px-2 py-2">Period</span>
            </div>
            <div
              className="grid grid-cols-3 divide-x divide-border/50"
              style={{ maxHeight: Math.max(120, box.maxHeight - 44) }}
            >
              <div className="overflow-y-auto overscroll-contain py-1">
                {hours.map((h) => {
                  const active = h === hour12;
                  return (
                    <button
                      key={h}
                      type="button"
                      className={`flex w-full items-center justify-center px-2 py-2 text-sm ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-surface-muted"
                      }`}
                      onClick={() => commit(h, minute, period)}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
              <div className="overflow-y-auto overscroll-contain py-1">
                {minutes.map((mins) => {
                  const active = mins === minute;
                  return (
                    <button
                      key={mins}
                      type="button"
                      className={`flex w-full items-center justify-center px-2 py-2 text-sm ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-surface-muted"
                      }`}
                      onClick={() => commit(hour12, mins, period)}
                    >
                      {String(mins).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
              <div className="overflow-y-auto overscroll-contain py-1">
                {(["AM", "PM"] as const).map((p) => {
                  const active = p === period;
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`flex w-full items-center justify-center px-2 py-2 text-sm ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-surface-muted"
                      }`}
                      onClick={() => commit(hour12, minute, p)}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-border/50 p-2">
              <button
                type="button"
                className="btn-primary w-full !rounded-lg !py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                Done
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
        <Clock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      </button>
      {menu}
    </div>
  );
}

"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type ConstrainedSelectOption = {
  value: string;
  label: string;
};

type ConstrainedSelectProps = {
  id?: string;
  value: string;
  options: ConstrainedSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Shown when value is empty and no option matches. */
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

type MenuBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
};

/**
 * Full-width select whose open list matches the trigger width.
 * Renders the menu in a portal so it is not clipped by modal overflow,
 * and stays within the viewport on mobile.
 */
export function ConstrainedSelect({
  id,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Select…",
  className = "",
  "aria-label": ariaLabel,
}: ConstrainedSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<MenuBox | null>(null);
  const [mounted, setMounted] = useState(false);

  const selected = options.find((opt) => opt.value === value);
  const displayLabel = selected?.label ?? (value ? value : placeholder);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }

    function measure() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportPad = 8;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPad;
      const spaceAbove = rect.top - viewportPad;
      const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(240, openUp ? spaceAbove : spaceBelow));
      setBox({
        top: openUp ? rect.top : rect.bottom + 4,
        left: Math.max(viewportPad, Math.min(rect.left, window.innerWidth - rect.width - viewportPad)),
        width: rect.width,
        maxHeight,
        openUp,
      });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menu =
    open && box && mounted
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-labelledby={id}
            className="z-[80] overflow-y-auto overflow-x-hidden rounded-lg border border-border/70 bg-surface py-1 shadow-lg"
            style={{
              position: "fixed",
              top: box.openUp ? undefined : box.top,
              bottom: box.openUp ? window.innerHeight - box.top + 4 : undefined,
              left: box.left,
              width: box.width,
              maxHeight: box.maxHeight,
            }}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={`${opt.value}::${opt.label}`} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`flex w-full min-w-0 px-3.5 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-surface-muted"
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>,
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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        className="input-field flex w-full min-w-0 items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span
          className={`min-w-0 truncate ${selected || value ? "text-foreground" : "text-muted"}`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}

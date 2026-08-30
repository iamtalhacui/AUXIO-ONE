"use client";

import type { ModuleAccessLevel } from "@/lib/dashboard/content/org-admin-roles";

const LEVELS: { value: ModuleAccessLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "view", label: "View" },
  { value: "full", label: "Full" },
];

const levelStyles: Record<ModuleAccessLevel, string> = {
  none: "text-muted",
  view: "text-primary",
  full: "text-emerald-700",
};

type ModuleAccessSegmentProps = {
  value: ModuleAccessLevel;
  onChange: (level: ModuleAccessLevel) => void;
  compact?: boolean;
};

export function ModuleAccessSegment({ value, onChange, compact }: ModuleAccessSegmentProps) {
  const activeIndex = LEVELS.findIndex((level) => level.value === value);

  return (
    <div
      className={`relative flex rounded-xl border border-border/80 bg-surface-muted/50 p-1 ${
        compact ? "w-full" : "w-full sm:w-auto sm:min-w-[11rem]"
      }`}
      role="group"
      aria-label="Module access level"
    >
      <span
        className="pointer-events-none absolute inset-y-1 rounded-lg bg-surface shadow-sm transition-all duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / 3)`,
          left: `calc(0.25rem + ${activeIndex} * ((100% - 0.5rem) / 3))`,
        }}
      />
      {LEVELS.map((level) => {
        const active = value === level.value;

        return (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            aria-pressed={active}
            className={`relative z-10 flex-1 rounded-lg px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide transition-colors duration-200 sm:px-3 sm:text-xs ${
              active ? levelStyles[level.value] : "text-muted hover:text-foreground"
            }`}
          >
            {level.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

type PermissionPillProps = {
  granted: boolean;
  onToggle: () => void;
  label?: string;
};

export function PermissionPill({ granted, onToggle, label }: PermissionPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={granted}
      aria-label={label ?? (granted ? "Revoke permission" : "Grant permission")}
      className={`group relative inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        granted
          ? "bg-primary text-white shadow-[0_8px_24px_rgba(17,94,89,0.28)] hover:bg-primary-light"
          : "border border-border bg-surface-muted/60 text-muted hover:border-primary/30 hover:text-foreground"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full transition-all duration-300 ${
          granted ? "bg-white/20" : "bg-border/80 group-hover:bg-primary/15"
        }`}
      >
        {granted ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-white stroke-[2]" aria-hidden>
            <path d="M2 6l3 3 5-5" />
          </svg>
        ) : (
          <span className="h-1 w-1 rounded-full bg-muted/70" />
        )}
      </span>
      <span>{granted ? "Allowed" : "Denied"}</span>
    </button>
  );
}

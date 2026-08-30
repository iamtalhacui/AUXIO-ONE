import type { OrgStatus } from "@/lib/api/types";

const styles: Record<OrgStatus, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  SUSPENDED: "bg-accent/10 text-accent",
  CLOSED: "bg-surface-muted text-muted",
};

export function OrgStatusBadge({ status }: { status: OrgStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

export function InviteStatusBadge({ status }: { status: "INVITED" | "EXPIRED" }) {
  const styles = {
    INVITED: "bg-primary/10 text-primary",
    EXPIRED: "bg-accent/10 text-accent",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

export function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    CREATE: "bg-primary/10 text-primary",
    MODULE_ENABLE: "bg-emerald-100 text-emerald-700",
    MODULE_DISABLE: "bg-accent/10 text-accent",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[action] ?? "bg-surface-muted text-muted"}`}
    >
      {action.replace("_", " ")}
    </span>
  );
}

export function HealthBadge({ status }: { status: "healthy" | "warning" | "error" }) {
  const styles = {
    healthy: "bg-primary/10 text-primary",
    warning: "bg-accent/10 text-accent",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

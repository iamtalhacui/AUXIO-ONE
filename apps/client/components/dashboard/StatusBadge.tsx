type BadgeStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";

const styles: Record<BadgeStatus, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  SUSPENDED: "bg-surface-muted text-muted",
  CLOSED: "bg-surface-muted text-muted",
};

export function OrgStatusBadge({ status }: { status: BadgeStatus }) {
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
    ORGANISATION_CREATED: "bg-primary/10 text-primary",
    MODULE_ENABLE: "bg-emerald-100 text-emerald-700",
    MODULE_DISABLE: "bg-accent/10 text-accent",
    MAINTENANCE_ON: "bg-accent/10 text-accent",
    MAINTENANCE_OFF: "bg-primary/10 text-primary",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[action] ?? "bg-surface-muted text-muted"}`}
    >
      {action.replaceAll("_", " ")}
    </span>
  );
}

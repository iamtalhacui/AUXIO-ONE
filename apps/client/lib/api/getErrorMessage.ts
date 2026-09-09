export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (typeof error === "object" && error !== null) {
    const data = "data" in error ? (error as { data?: unknown }).data : undefined;
    if (typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
    if ("error" in error && typeof (error as { error?: unknown }).error === "string") {
      return (error as { error: string }).error;
    }
  }
  return fallback;
}

const MAINTENANCE_NOTICE_KEY = "auxio_org_maintenance";

// Only maintenance 403s should end the org session — other 403s (module off, not admin) must not.
export function isMaintenanceError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("status" in error)) return false;
  if ((error as { status?: unknown }).status !== 403) return false;
  return getErrorMessage(error, "").toLowerCase().includes("maintenance");
}

export function rememberMaintenanceLogout() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(MAINTENANCE_NOTICE_KEY, "1");
}

export function takeMaintenanceLogoutNotice(): string | null {
  if (typeof window === "undefined") return null;
  if (!sessionStorage.getItem(MAINTENANCE_NOTICE_KEY)) return null;
  sessionStorage.removeItem(MAINTENANCE_NOTICE_KEY);
  return "The platform is in maintenance mode. Please try again later.";
}

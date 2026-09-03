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

import type { ApiErrorBody } from "@/lib/api/types";

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: ApiErrorBody }).data;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    if (typeof data?.message === "string") return data.message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}

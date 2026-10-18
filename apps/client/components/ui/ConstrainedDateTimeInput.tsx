"use client";

import { ConstrainedDateInput } from "@/components/ui/ConstrainedDateInput";
import { ConstrainedTimeInput } from "@/components/ui/ConstrainedTimeInput";

type ConstrainedDateTimeInputProps = {
  id?: string;
  /** Local datetime string `YYYY-MM-DDTHH:mm` (same as input[type=datetime-local]). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

function splitLocal(value: string) {
  if (!value || !value.includes("T")) {
    return { date: "", time: "09:00" };
  }
  const [date, timeRaw = "09:00"] = value.split("T");
  const time = timeRaw.slice(0, 5);
  return { date, time };
}

/**
 * Mobile-safe date+time pair. Replaces native datetime-local popups.
 */
export function ConstrainedDateTimeInput({
  id,
  value,
  onChange,
  disabled,
  className = "",
  "aria-label": ariaLabel = "Date and time",
}: ConstrainedDateTimeInputProps) {
  const { date, time } = splitLocal(value);

  function emit(nextDate: string, nextTime: string) {
    if (!nextDate) {
      onChange("");
      return;
    }
    onChange(`${nextDate}T${nextTime || "09:00"}`);
  }

  return (
    <div className={`grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}>
      <ConstrainedDateInput
        id={id ? `${id}-date` : undefined}
        aria-label={`${ariaLabel} date`}
        value={date}
        disabled={disabled}
        onChange={(next) => emit(next, time)}
      />
      <ConstrainedTimeInput
        id={id ? `${id}-time` : undefined}
        aria-label={`${ariaLabel} time`}
        value={time}
        disabled={disabled || !date}
        onChange={(next) => emit(date, next)}
      />
    </div>
  );
}

/** Shared date/time helpers for the schedule UI (Phase A). */

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatShortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShiftTime(start: string, end: string) {
  return `${start} – ${end}`;
}

export function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number) {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function endTimeFromDuration(startTime: string, durationMinutes: number) {
  return minutesToTime(parseTimeToMinutes(startTime) + durationMinutes);
}

/**
 * Minutes between start and end. If end is earlier than (or equal to) start,
 * treat it as finishing the next day (overnight shift).
 */
export function durationMinutesFromTimes(startTime: string, endTime: string) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

/** Snap a minute count down/up to the nearest 5-minute step (minimum 5). */
export function snapDurationMinutes(minutes: number) {
  const snapped = Math.round(minutes / 5) * 5;
  return Math.max(5, snapped);
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * @deprecated Prefer zonedWallTimeToUtc from useShiftClock — wall times belong
 * to the organisation timezone, not a raw UTC read of HH:mm.
 */
export function shiftDateTime(dateIso: string, time: string) {
  return new Date(`${dateIso}T${time}:00.000Z`);
}

/** Wall clock for a recorded instant, in the organisation timezone. */
export function formatClock(iso: string, timeZone = "UTC") {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
}

export function formatDateTime(iso: string, timeZone = "UTC") {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
}

/** Compact running clock: "2h 04m", "12m 30s", "45s". */
export function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** Countdown that collapses to days once the shift is far away. */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  if (days >= 1) {
    const hours = Math.floor((total % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  return formatElapsed(ms);
}

export function formatVariance(minutes: number) {
  const abs = Math.abs(minutes);
  if (abs === 0) return "on time";
  const direction = minutes > 0 ? "late" : "early";
  if (abs < 60) {
    return `${abs} ${abs === 1 ? "min" : "mins"} ${direction}`;
  }
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (m === 0) return `${h}h ${direction}`;
  return `${h}h ${String(m).padStart(2, "0")}m ${direction}`;
}

/** "Today", "Tomorrow", or a weekday heading for list grouping. */
export function formatDayHeading(iso: string) {
  const today = todayIso();
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export const BOARD_START_HOUR = 6;
export const BOARD_END_HOUR = 22;

/** Common service lines for shift create (free text also allowed via select). */
export const SERVICE_LINE_OPTIONS = [
  "Personal care",
  "Community access",
  "Respite",
  "Behaviour support",
  "High intensity",
  "Medication support",
];

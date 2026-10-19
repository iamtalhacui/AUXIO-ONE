/**
 * Australian organisation timezones offered at register / org settings.
 * Values are IANA ids used for shift start/finish variance.
 */

export type AuTimezoneOption = {
  value: string;
  label: string;
  hint: string;
};

export const AU_TIMEZONES: readonly AuTimezoneOption[] = [
  {
    value: "Australia/Sydney",
    label: "Sydney (NSW)",
    hint: "Also Canberra · uses daylight saving",
  },
  {
    value: "Australia/Melbourne",
    label: "Melbourne (VIC)",
    hint: "Uses daylight saving",
  },
  {
    value: "Australia/Hobart",
    label: "Hobart (TAS)",
    hint: "Uses daylight saving",
  },
  {
    value: "Australia/Brisbane",
    label: "Brisbane (QLD)",
    hint: "No daylight saving",
  },
  {
    value: "Australia/Adelaide",
    label: "Adelaide (SA)",
    hint: "Uses daylight saving",
  },
  {
    value: "Australia/Darwin",
    label: "Darwin (NT)",
    hint: "No daylight saving",
  },
  {
    value: "Australia/Perth",
    label: "Perth (WA)",
    hint: "No daylight saving",
  },
] as const;

export const AU_TIMEZONE_VALUES = AU_TIMEZONES.map((z) => z.value);

export const DEFAULT_AU_TIMEZONE = AU_TIMEZONES[0].value;

export function isAuTimezone(value: string): boolean {
  return AU_TIMEZONE_VALUES.includes(value);
}

/** Short label for UI chips, e.g. "Sydney (NSW)". */
export function auTimezoneLabel(value: string | null | undefined): string {
  if (!value) return "UTC";
  const hit = AU_TIMEZONES.find((z) => z.value === value);
  if (hit) return hit.label;
  if (value.startsWith("Australia/")) return value.replace("Australia/", "");
  return value;
}

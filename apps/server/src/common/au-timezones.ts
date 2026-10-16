/** Allowed organisation timezones (Australian NDIS providers). */
export const AU_TIMEZONES = [
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Hobart',
  'Australia/Brisbane',
  'Australia/Adelaide',
  'Australia/Darwin',
  'Australia/Perth',
] as const;

export type AuTimezone = (typeof AU_TIMEZONES)[number];

export function isAuTimezone(value: string): value is AuTimezone {
  return (AU_TIMEZONES as readonly string[]).includes(value);
}

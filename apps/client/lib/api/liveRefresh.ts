/**
 * Shared live-refresh intervals for data that other users can change
 * while you are already on the page (RTK Query only auto-updates your
 * own mutations — other browsers need polling / focus refetch).
 */
export const LIVE_POLL_MS = {
  /** Bell badge + notification drawer */
  notifications: 10_000,
  /** Approvals, my shifts, schedule board, matching, team */
  lists: 15_000,
} as const;

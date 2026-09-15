export type ShiftStatus =
  | "UNASSIGNED"
  | "OFFERED"
  | "ASSIGNED"
  | "COMPLETED"
  | "CANCELLED";

export type LocationKind = "PARTICIPANT" | "SITE" | "OTHER";

export type RosterWorker = {
  id: string;
  firstName: string;
  lastName: string;
  roleLabel: string;
  skills: string[];
  region: string;
  hoursThisWeek: number;
  /** Baseline weekly availability flag for demo eligibility. */
  available: boolean;
  complianceOk: boolean;
};

export type RosterShift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  workerId: string | null;
  /** Worker who currently has an outstanding offer (awaiting accept/decline). */
  offeredWorkerId: string | null;
  locationKind: LocationKind;
  participantName: string;
  locationLabel: string;
  serviceLine: string;
  serviceTitle: string;
  status: ShiftStatus;
  recurring?: boolean;
  notes?: string;
};

export type EligibleEmployee = {
  workerId: string;
  available: boolean;
  complianceOk: boolean;
  hasConflict: boolean;
  eligible: boolean;
  blockers: string[];
};

export type CreateShiftInput = {
  locationKind: LocationKind;
  participantName: string;
  locationLabel: string;
  serviceLine: string;
  serviceTitle: string;
  date: string;
  startTime: string;
  durationHours: number;
  recurring: boolean;
  notes?: string;
};

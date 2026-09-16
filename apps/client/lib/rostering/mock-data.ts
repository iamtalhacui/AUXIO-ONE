import type { CreateShiftInput, EligibleEmployee, RosterShift, RosterWorker } from "./types";

/** Fixed demo day so UI always has content. */
export const DEMO_DATE = "2026-09-15";

export const DEMO_PARTICIPANTS = [
  "Noah P.",
  "Ella M.",
  "Daniel K.",
  "Mia R.",
  "Ava S.",
  "Leo T.",
];

export const DEMO_SITES = [
  "Riverside Supported Living",
  "Community Hub East",
  "Oak Street SIL",
  "Westside Day Program",
];

export const DEMO_SERVICE_LINES = [
  "Personal care",
  "Community access",
  "Respite",
  "Behaviour support",
  "High intensity",
  "Medication support",
];

export const ROSTER_WORKERS: RosterWorker[] = [
  {
    id: "w1",
    firstName: "Amina",
    lastName: "Hassan",
    roleLabel: "Support worker",
    skills: ["Personal care", "Community access"],
    region: "North",
    hoursThisWeek: 28,
    available: true,
    complianceOk: true,
  },
  {
    id: "w2",
    firstName: "James",
    lastName: "Okello",
    roleLabel: "Support worker",
    skills: ["High intensity", "Behaviour support"],
    region: "East",
    hoursThisWeek: 32,
    available: true,
    complianceOk: true,
  },
  {
    id: "w3",
    firstName: "Priya",
    lastName: "Nair",
    roleLabel: "Support worker",
    skills: ["Personal care", "Medication support"],
    region: "North",
    hoursThisWeek: 24,
    available: false,
    complianceOk: true,
  },
  {
    id: "w4",
    firstName: "Liam",
    lastName: "Chen",
    roleLabel: "Support worker",
    skills: ["Community access", "Transport"],
    region: "West",
    hoursThisWeek: 36,
    available: true,
    complianceOk: false,
  },
  {
    id: "w5",
    firstName: "Sofia",
    lastName: "Martinez",
    roleLabel: "Support worker",
    skills: ["Personal care", "Community access", "Respite"],
    region: "East",
    hoursThisWeek: 20,
    available: true,
    complianceOk: true,
  },
];

/** Seed shifts — no double-booked workers; unassigned go through Matching. */
export const INITIAL_ROSTER_SHIFTS: RosterShift[] = [
  {
    id: "s1",
    date: DEMO_DATE,
    startTime: "07:00",
    endTime: "11:00",
    durationHours: 4,
    workerId: "w1",
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Noah P.",
    locationLabel: "Riverside Supported Living",
    serviceLine: "Personal care",
    serviceTitle: "Morning personal care",
    status: "ASSIGNED",
  },
  {
    id: "s2",
    date: DEMO_DATE,
    startTime: "08:00",
    endTime: "14:00",
    durationHours: 6,
    workerId: "w2",
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Ella M.",
    locationLabel: "Community Hub East",
    serviceLine: "Community access",
    serviceTitle: "Community outing",
    status: "ASSIGNED",
  },
  {
    id: "s3",
    date: DEMO_DATE,
    startTime: "14:00",
    endTime: "18:00",
    durationHours: 4,
    workerId: null,
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Daniel K.",
    locationLabel: "Oak Street SIL",
    serviceLine: "Personal care",
    serviceTitle: "Afternoon support",
    status: "UNASSIGNED",
  },
  {
    id: "s4",
    date: DEMO_DATE,
    startTime: "12:00",
    endTime: "16:00",
    durationHours: 4,
    workerId: "w5",
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Mia R.",
    locationLabel: "Riverside Supported Living",
    serviceLine: "Respite",
    serviceTitle: "Afternoon respite",
    status: "ASSIGNED",
  },
  {
    id: "s6",
    date: DEMO_DATE,
    startTime: "16:00",
    endTime: "20:00",
    durationHours: 4,
    workerId: "w1",
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Ava S.",
    locationLabel: "Westside Day Program",
    serviceLine: "Community access",
    serviceTitle: "Evening community access",
    status: "ASSIGNED",
  },
  {
    id: "s7",
    date: DEMO_DATE,
    startTime: "18:00",
    endTime: "22:00",
    durationHours: 4,
    workerId: null,
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Leo T.",
    locationLabel: "Oak Street SIL",
    serviceLine: "High intensity",
    serviceTitle: "Evening high intensity",
    status: "UNASSIGNED",
  },
  {
    id: "s8",
    date: "2026-09-16",
    startTime: "07:30",
    endTime: "12:00",
    durationHours: 4.5,
    workerId: "w1",
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Noah P.",
    locationLabel: "Riverside Supported Living",
    serviceLine: "Personal care",
    serviceTitle: "Morning personal care",
    status: "ASSIGNED",
  },
  {
    id: "s9",
    date: "2026-09-16",
    startTime: "09:00",
    endTime: "15:00",
    durationHours: 6,
    workerId: "w5",
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Mia R.",
    locationLabel: "Westside Day Program",
    serviceLine: "Community access",
    serviceTitle: "Day program support",
    status: "ASSIGNED",
  },
  {
    id: "s10",
    date: "2026-09-14",
    startTime: "08:00",
    endTime: "16:00",
    durationHours: 8,
    workerId: "w1",
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Ella M.",
    locationLabel: "Community Hub East",
    serviceLine: "Community access",
    serviceTitle: "Full day community access",
    status: "COMPLETED",
  },
  {
    id: "s11",
    date: "2026-09-17",
    startTime: "13:00",
    endTime: "19:00",
    durationHours: 6,
    workerId: null,
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Daniel K.",
    locationLabel: "Oak Street SIL",
    serviceLine: "Personal care",
    serviceTitle: "Afternoon support",
    status: "UNASSIGNED",
  },
  {
    id: "s12",
    date: "2026-09-18",
    startTime: "06:00",
    endTime: "10:00",
    durationHours: 4,
    workerId: null,
    offeredWorkerId: null,
    locationKind: "SITE",
    participantName: "Ava S.",
    locationLabel: "Riverside Supported Living",
    serviceLine: "Personal care",
    serviceTitle: "Early morning care",
    status: "UNASSIGNED",
  },
];

/** Demo employee is Amina (w1). */
export const DEMO_EMPLOYEE_WORKER_ID = "w1";

export function workerName(worker: RosterWorker) {
  return `${worker.firstName} ${worker.lastName}`;
}

export function getWorker(id: string | null) {
  if (!id) return null;
  return ROSTER_WORKERS.find((w) => w.id === id) ?? null;
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

export function endTimeFromDuration(startTime: string, durationHours: number) {
  return minutesToTime(parseTimeToMinutes(startTime) + Math.round(durationHours * 60));
}

export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  const as = parseTimeToMinutes(aStart);
  const ae = parseTimeToMinutes(aEnd);
  const bs = parseTimeToMinutes(bStart);
  const be = parseTimeToMinutes(bEnd);
  return as < be && bs < ae;
}

export function workerHasConflict(
  shifts: RosterShift[],
  workerId: string,
  candidate: Pick<RosterShift, "date" | "startTime" | "endTime" | "id">,
) {
  return shifts.some(
    (s) =>
      s.id !== candidate.id &&
      s.date === candidate.date &&
      s.workerId === workerId &&
      (s.status === "ASSIGNED" || s.status === "OFFERED") &&
      timesOverlap(s.startTime, s.endTime, candidate.startTime, candidate.endTime),
  );
}

export function getEligibleEmployees(
  shifts: RosterShift[],
  shift: RosterShift,
): EligibleEmployee[] {
  return ROSTER_WORKERS.map((worker) => {
    const hasConflict = workerHasConflict(shifts, worker.id, shift);
    const blockers: string[] = [];
    if (!worker.available) blockers.push("Unavailable");
    if (!worker.complianceOk) blockers.push("Not ready / compliance");
    if (hasConflict) blockers.push("Scheduling conflict");

    const eligible =
      worker.available && worker.complianceOk && !hasConflict;

    return {
      workerId: worker.id,
      available: worker.available,
      complianceOk: worker.complianceOk,
      hasConflict,
      eligible,
      blockers,
    };
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible));
}

export function buildShiftFromInput(input: CreateShiftInput, id: string): RosterShift {
  const endTime = endTimeFromDuration(input.startTime, input.durationHours);
  return {
    id,
    date: input.date,
    startTime: input.startTime,
    endTime,
    durationHours: input.durationHours,
    workerId: null,
    offeredWorkerId: null,
    locationKind: input.locationKind,
    participantName: input.participantName,
    locationLabel: input.locationLabel,
    serviceLine: input.serviceLine,
    serviceTitle: input.serviceTitle,
    status: "UNASSIGNED",
    recurring: input.recurring,
    notes: input.notes,
  };
}

export const BOARD_START_HOUR = 6;
export const BOARD_END_HOUR = 22;

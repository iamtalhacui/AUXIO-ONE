import type { DashboardOnboardingState } from "@/lib/onboarding/wizard-state";

export type MemberOnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "CHANGES_REQUIRED";

export type MemberOnboardingRecord = {
  status: MemberOnboardingStatus;
  currentStep?: number;
  totalSteps?: number;
  submittedAt?: string;
  returnedAt?: string;
  verifiedAt?: string;
  invitedAt?: string;
  updatedAt: string;
  role?: string;
  reviewNote?: string;
  reviewerName?: string;
  submission?: DashboardOnboardingState;
};

type OrgOnboardingMap = Record<string, MemberOnboardingRecord>;

function storageKey(organisationId: string) {
  return `auxio_org_onboarding_${organisationId}`;
}

function readMap(organisationId: string): OrgOnboardingMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(organisationId));
    if (!raw) return {};
    return JSON.parse(raw) as OrgOnboardingMap;
  } catch {
    return {};
  }
}

function writeMap(organisationId: string, map: OrgOnboardingMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(organisationId), JSON.stringify(map));
}

export function getMemberOnboardingRecord(
  organisationId: string | null | undefined,
  userId: string,
): MemberOnboardingRecord | null {
  if (!organisationId) return null;
  return readMap(organisationId)[userId] ?? null;
}

export function upsertMemberOnboarding(
  organisationId: string | null | undefined,
  userId: string,
  patch: Partial<MemberOnboardingRecord> & { status: MemberOnboardingStatus },
) {
  if (!organisationId || typeof window === "undefined") return;
  const map = readMap(organisationId);
  map[userId] = {
    ...map[userId],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeMap(organisationId, map);
  window.dispatchEvent(new Event("auxio-onboarding-updated"));
}

export function formatOnboardingDetail(record: MemberOnboardingRecord | null, invitedAt?: string) {
  if (!record) {
    if (!invitedAt) return "—";
    return `Invited ${formatShortDate(invitedAt)}`;
  }

  switch (record.status) {
    case "PENDING_REVIEW":
      return record.submittedAt
        ? `Submitted ${formatShortDate(record.submittedAt)}`
        : "Submitted";
    case "IN_PROGRESS":
      return `Step ${record.currentStep ?? 1} of ${record.totalSteps ?? 5}`;
    case "VERIFIED":
      return record.verifiedAt
        ? `Verified ${formatShortDate(record.verifiedAt)}`
        : "Verified";
    case "CHANGES_REQUIRED":
      return record.returnedAt
        ? `Returned ${formatShortDate(record.returnedAt)}`
        : "Changes required";
    case "NOT_STARTED":
    default:
      return record.invitedAt || invitedAt
        ? `Invited ${formatShortDate(record.invitedAt ?? invitedAt!)}`
        : "Not started";
  }
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

export function resolveMemberOnboardingStatus(args: {
  role: string;
  accountStatus: string;
  record: MemberOnboardingRecord | null;
}): MemberOnboardingStatus | null {
  if (args.role === "ORG_ADMIN") return null;
  if (args.record?.status) return args.record.status;
  if (args.accountStatus === "INVITED") return "NOT_STARTED";
  return "NOT_STARTED";
}

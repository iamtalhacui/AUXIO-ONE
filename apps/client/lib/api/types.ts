export type PlatformUser = {
  id: string;
  email: string;
  name: string;
};

export type PlatformLoginResponse = {
  accessToken: string;
  user: PlatformUser;
};

export type OrgPlan = "BASIC" | "ADVANCED" | "CUSTOM";
export type OrgStatus = "ACTIVE" | "SUSPENDED";
export type UserStatus = "INVITED" | "ACTIVE" | "SUSPENDED";
export type OnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "CHANGES_REQUIRED";

export type RegisterOrganisationRequest = {
  name: string;
  timezone: string;
  contactEmail: string;
  contactPhone?: string;
  plan: OrgPlan;
  /** Add-on modules for the Custom plan. Core modules are granted regardless. */
  moduleCodes?: string[];
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
};

export type RegisterOrganisationResponse = {
  organisation: {
    id: string;
    name: string;
    plan: OrgPlan;
    status: OrgStatus;
  };
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: UserStatus;
  };
  modulesEntitled: number;
};

export type PlatformOrganisation = {
  id: string;
  name: string;
  timezone: string;
  email: string;
  phone: string | null;
  plan: OrgPlan;
  status: OrgStatus;
  createdAt: string;
  modulesEnabled: number;
  modulesGranted: number;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: UserStatus;
    platformApproved: boolean;
    approvalStatus: "INVITED" | "AWAITING_APPROVAL" | "APPROVED" | "REJECTED";
  } | null;
};

export type SetupAccountRequest = {
  token: string;
  password: string;
};

export type SetupAccountResponse = {
  message: string;
  email: string;
  awaitingPlatformApproval?: boolean;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  otp: string;
  password: string;
};

export type OrgUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: UserStatus;
  onboardingStatus: OnboardingStatus;
  platformApproved: boolean;
  organisationId: string;
};

export type OrgSummary = {
  id: string;
  name: string;
  tradingName: string | null;
  tagline: string | null;
  timezone: string;
  email: string;
  phone: string | null;
  brandColor: string;
  hasLogo: boolean;
  plan: OrgPlan;
  status: OrgStatus;
};

export type UpdateOrganisationRequest = {
  name: string;
  tradingName?: string;
  tagline?: string;
  email: string;
  phone?: string;
  timezone: string;
};

export type OrgLoginResponse = {
  accessToken: string;
  user: OrgUser;
  organisation: OrgSummary;
};

export type OrgMeResponse = {
  user: OrgUser;
  organisation: OrgSummary;
};

export type OrgModule = {
  code: string;
  name: string;
  description: string;
  isCore: boolean;
  enabled: boolean;
};

export type WorkforceRole = "MANAGER" | "ROSTERING_EXPERT" | "EMPLOYEE";

export type OrgTeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: UserStatus;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
};

// GET /organisation/overview — Org Admin home dashboard aggregate.
export type OrgAdminOverview = {
  organisation: { name: string; plan: OrgPlan; status: OrgStatus };
  kpis: {
    teamTotal: number;
    teamActive: number;
    awaitingAction: number;
    modulesEnabled: number;
    modulesGranted: number;
  };
  teamJoinsLast14Days: Array<{ date: string; count: number }>;
  attention: {
    pendingOnboardingReviews: Array<{
      userId: string;
      name: string;
      role: string;
      submittedAt: string;
    }>;
    pendingShiftApprovals: Array<{
      shiftId: string;
      participantName: string;
      variance: number;
      endedAt: string | null;
    }>;
    staleInvites: Array<{
      userId: string;
      name: string;
      email: string;
      invitedAt: string;
    }>;
  };
  onboardingFunnel: {
    NOT_STARTED: number;
    IN_PROGRESS: number;
    PENDING_REVIEW: number;
    VERIFIED: number;
    CHANGES_REQUIRED: number;
  };
  roleMix: {
    MANAGER: number;
    ROSTERING_EXPERT: number;
    EMPLOYEE: number;
  };
  approvalLoadLast30Days: {
    autoApproved: number;
    needsReview: number;
    rejected: number;
  };
};

export type RegisterTeamMemberRequest = {
  firstName: string;
  lastName: string;
  email: string;
  role: WorkforceRole;
};

export type UpdateTeamMemberRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: WorkforceRole;
  status?: UserStatus;
};

export type OnboardingDocumentMeta = {
  id: string;
  fieldKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type OnboardingSubmissionDto = {
  id: string;
  userId: string;
  organisationId: string;
  roleSnapshot: string;
  currentStep: number;
  payload: {
    personal?: Record<string, string | string[]>;
    work?: Record<string, string | string[]>;
  };
  status: OnboardingStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  documents: OnboardingDocumentMeta[];
};

export type OnboardingMeResponse = {
  onboardingStatus: OnboardingStatus;
  editable: boolean;
  template: unknown;
  submission: OnboardingSubmissionDto | null;
};

export type SaveOnboardingDraftRequest = {
  currentStep?: number;
  payload: {
    personal?: Record<string, string | string[]>;
    work?: Record<string, string | string[]>;
  };
};

export type OnboardingAdminDetailResponse = {
  template: unknown;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: UserStatus;
    onboardingStatus: OnboardingStatus;
  };
  submission: OnboardingSubmissionDto & {
    reviewedBy?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  };
};

export type ReviewOnboardingRequest = {
  decision: "VERIFIED" | "CHANGES_REQUIRED";
  note?: string;
};

// ── Super Admin platform views ──

export type PlatformModule = {
  id: string;
  code: string;
  name: string;
  description: string;
  isCore: boolean;
};

export type PlatformAuditEntry = {
  id: string;
  action: string;
  actorEmail: string;
  organisationName: string | null;
  details: string;
  createdAt: string;
};

export type PlatformEntitlement = {
  id: string;
  organisationName: string;
  moduleCode: string;
  moduleName: string;
  enabled: boolean;
  grantedAt: string;
};

export type PlatformInvite = {
  id: string;
  name: string;
  email: string;
  role: string;
  organisationName: string;
  invitedAt: string;
  expired: boolean;
};

export type PlatformSettings = {
  maintenanceMode: boolean;
  updatedAt: string;
};

export type PlatformOverview = {
  maintenanceMode: boolean;
  kpis: {
    organisationsTotal: number;
    organisationsActive: number;
    organisationsSuspended: number;
    awaitingAction: number;
    planMix: { BASIC: number; ADVANCED: number; CUSTOM: number };
    dominantPlan: OrgPlan | null;
    optionalModulesEnabled: number;
    optionalModulesGranted: number;
  };
  attention: {
    awaitingApproval: Array<{
      organisationId: string;
      organisationName: string;
      adminName: string;
      adminEmail: string;
      createdAt: string;
    }>;
    pendingDemos: Array<{
      id: string;
      organisationName: string;
      contactName: string;
      preferredDate: string;
      createdAt: string;
    }>;
    suspendedOrgs: Array<{
      id: string;
      name: string;
      createdAt: string;
    }>;
    staleInvites: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      organisationId: string;
      organisationName: string;
      invitedAt: string;
    }>;
  };
  registrationsLast30Days: Array<{ date: string; count: number }>;
  demoPipeline: { PENDING: number; CONTACTED: number; COMPLETED: number };
  moduleAdoption: Array<{
    code: string;
    name: string;
    entitledOrgs: number;
    enabledOrgs: number;
    percent: number;
  }>;
  recentOrganisations: Array<{
    id: string;
    name: string;
    email: string;
    plan: OrgPlan;
    status: OrgStatus;
    modulesEnabled: number;
    modulesGranted: number;
    createdAt: string;
    adminApprovalStatus:
      | "INVITED"
      | "AWAITING_APPROVAL"
      | "APPROVED"
      | "REJECTED"
      | null;
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    actorEmail: string;
    organisationName: string | null;
    details: string;
    createdAt: string;
  }>;
};

export type DemoRequestStatus = "PENDING" | "CONTACTED" | "COMPLETED";

export type DemoRequest = {
  id: string;
  organisationName: string;
  contactName: string;
  email: string;
  phone: string | null;
  numberOfUsers: number | null;
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: DemoRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type PlatformOrganisationDetail = PlatformOrganisation & {
  updatedAt: string;
  modules: Array<{
    code: string;
    name: string;
    description: string;
    isCore: boolean;
    enabled: boolean;
  }>;
};

// ── Customers (CUSTOMERS module) ──

export type CustomerStatus = "ONBOARDING" | "ACTIVE" | "PAUSED" | "ARCHIVED";

export type CustomerDocumentMeta = {
  id: string;
  kind: "MANDATORY" | "OPTIONAL";
  fieldKey: string;
  label: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type CustomerMandatorySlot = {
  fieldKey: string;
  label: string;
  uploaded: boolean;
  document: CustomerDocumentMeta | null;
};

export type Customer = {
  id: string;
  organisationId: string;
  firstName: string;
  middleName: string | null;
  preferredName: string | null;
  surname: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  serviceLine: string;
  planStartDate: string | null;
  planEndDate: string | null;
  status: CustomerStatus;
  supportSummary: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  goals: string | null;
  risks: string | null;
  sourceOpportunityId: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  mandatoryDocs: CustomerMandatorySlot[];
  optionalDocs: CustomerDocumentMeta[];
  mandatoryComplete: boolean;
  canActivate: boolean;
};

export type CreateCustomerRequest = {
  firstName: string;
  middleName?: string;
  preferredName?: string;
  surname: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  serviceLine?: string;
  planStartDate?: string;
  planEndDate?: string;
  supportSummary?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  goals?: string;
  risks?: string;
};

// ── CRM opportunities ──

export type OpportunityStage =
  | "ENQUIRY"
  | "QUALIFIED"
  | "PROPOSAL"
  | "ACCEPTED"
  | "LOST";

export type CrmOpportunity = {
  id: string;
  organisationId: string;
  title: string;
  serviceLine: string;
  ownerId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  stage: OpportunityStage;
  estimatedAnnualValue: number | null;
  nextFollowUpAt: string | null;
  followUpNote: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  convertedCustomer: {
    id: string;
    firstName: string;
    surname: string;
    status: CustomerStatus;
  } | null;
};

export type CrmPipelineSummary = {
  note: string;
  stages: Array<{
    stage: OpportunityStage;
    count: number;
    estimatedAnnualValue: number;
  }>;
};

export type CreateOpportunityRequest = {
  title: string;
  serviceLine?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  stage?: OpportunityStage;
  estimatedAnnualValue?: number;
  nextFollowUpAt?: string;
  followUpNote?: string;
};

export type UpdateOpportunityRequest = Partial<CreateOpportunityRequest>;

// ── Schedule / rostering (SCHEDULE module — Phase A) ──

export type ShiftStatus =
  | "DRAFT"
  | "UNFILLED"
  | "OFFERED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type ShiftLocationKind = "PARTICIPANT" | "SITE" | "OTHER";
export type RecurrenceFrequency = "WEEKLY" | "MONTHLY";
export type SeriesEditScope = "THIS" | "THIS_AND_FOLLOWING";
export type WorkerAvailabilityLevel = "FULL" | "PARTIAL" | "UNAVAILABLE";

export type ShiftTask = {
  id: string;
  label: string;
  sortOrder: number;
  required: boolean;
  completedAt: string | null;
};

export type ScheduleShift = {
  id: string;
  organisationId: string;
  seriesId: string | null;
  customerId: string | null;
  locationKind: ShiftLocationKind;
  locationLabel: string;
  participantName: string;
  serviceLine: string;
  serviceTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ShiftStatus;
  notes: string | null;
  progressNote: string | null;
  offeredWorkerId: string | null;
  assignedWorkerId: string | null;
  offeredWorkerName: string | null;
  assignedWorkerName: string | null;
  publishedAt: string | null;
  actualStartedAt: string | null;
  actualEndedAt: string | null;
  startVarianceMinutes: number | null;
  endVarianceMinutes: number | null;
  finishReason: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  tasks: ShiftTask[];
  createdAt: string;
  updatedAt: string;
};

export type ScheduleParticipantOption = {
  id: string;
  displayName: string;
  firstName: string;
  surname: string;
  serviceLine: string;
  status: string;
  address: string | null;
};

export type ScheduleWorkerOption = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  complianceOk: boolean;
  hasAvailabilityPattern: boolean;
};

export type MatchCandidate = {
  workerId: string;
  displayName: string;
  eligible: boolean;
  complianceOk: boolean;
  availability: WorkerAvailabilityLevel;
  hasConflict: boolean;
  blockers: string[];
};

export type CreateScheduleShiftRequest = {
  locationKind: ShiftLocationKind;
  customerId?: string;
  locationLabel: string;
  serviceLine: string;
  serviceTitle: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  notes?: string;
  recurring: boolean;
  frequency?: RecurrenceFrequency;
  interval?: number;
  untilDate?: string;
};

export type CreateScheduleShiftResponse = {
  seriesId: string | null;
  shifts: ScheduleShift[];
};

export type RecurrencePreview = {
  count: number;
  dates: string[];
};

export type UpdateScheduleShiftRequest = {
  locationKind?: ShiftLocationKind;
  customerId?: string | null;
  locationLabel?: string;
  serviceLine?: string;
  serviceTitle?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  notes?: string;
  seriesScope?: SeriesEditScope;
};

export type DayAvailability = {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type AvailabilityException = {
  id?: string;
  fromDate: string;
  toDate: string;
  reason?: string;
};

export type WorkerAvailabilityPayload = {
  weekly: DayAvailability[];
  exceptions: AvailabilityException[];
};

export type ParticipantCareView = {
  customerId: string;
  displayName: string;
  supportSummary: string | null;
  planStartDate: string | null;
  planEndDate: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  goals: string | null;
  risks: string | null;
  serviceLine: string;
  shiftRelationships: Array<{
    shiftId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: ShiftStatus;
    serviceTitle: string;
  }>;
};

export type ServiceLineTaskCatalogue = {
  serviceLine: string;
  labels: string[];
};


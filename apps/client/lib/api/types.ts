export type PlatformUser = {
  id: string;
  email: string;
  name: string;
};

export type PlatformLoginResponse = {
  accessToken: string;
  user: PlatformUser;
};

export type OrgPlan = "BASIC" | "ADVANCED";
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



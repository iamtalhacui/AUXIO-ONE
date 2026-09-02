export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  organisationId?: string | null;
  status?: string;
  serviceLine?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  mustChangePassword: boolean;
  user: AuthUser;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  mustChangePassword: boolean;
  user: AuthUser;
};

export type ModuleCeilingTemplate = "BASIC" | "ADVANCED" | "CUSTOM";

export type CreateOrganisationRequest = {
  legalName: string;
  tradingName?: string;
  contactEmail: string;
  contactPhone?: string;
  timeZone: string;
  moduleCeilingTemplate: ModuleCeilingTemplate;
  moduleCeilingCodes?: string[];
  orgAdminEmail: string;
  orgAdminName: string;
};

export type ModuleEntitlementSummary = {
  moduleCode: string;
  moduleName: string;
  ceilingGranted: boolean;
  enabled: boolean;
};

export type CreateOrganisationResponse = {
  organisation: {
    id: string;
    legalName: string;
    tradingName: string | null;
    contactEmail: string;
    moduleCeilingTemplate: ModuleCeilingTemplate;
  };
  orgAdmin: {
    id: string;
    email: string;
    name: string;
  };
  moduleEntitlements: ModuleEntitlementSummary[];
  inviteEmail?: { queued: boolean; sent?: boolean; error?: string };
};

export type OrgModuleEntitlement = {
  id: string;
  ceilingGranted: boolean;
  enabled: boolean;
  module: {
    code: string;
    name: string;
  };
};

export type ToggleModuleRequest = {
  enabled: boolean;
};

export type OrgStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";

export type OrganisationListItem = {
  id: string;
  legalName: string;
  tradingName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  timeZone: string;
  status: OrgStatus;
  createdAt: string;
  modulesGranted: number;
  modulesEnabled: number;
  orgAdminEmail: string | null;
  orgAdminName: string | null;
};

export type OrganisationDetail = {
  id: string;
  legalName: string;
  tradingName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  timeZone: string;
  status: OrgStatus;
  createdAt: string;
  updatedAt: string;
  orgAdmin: {
    id: string;
    email: string;
    name: string;
    status: string;
  } | null;
  moduleEntitlements: ModuleEntitlementSummary[];
};

export type UpdateOrganisationRequest = {
  legalName?: string;
  tradingName?: string;
  contactEmail?: string;
  contactPhone?: string;
  timeZone?: string;
  status?: OrgStatus;
};

export type UpdateModuleCeilingRequest = {
  moduleCeilingCodes: string[];
};

export type OrgAdminProfile = {
  id: string;
  legalName: string;
  tradingName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  timeZone: string;
  tagline: string | null;
  brandColor: string;
  logoData: string | null;
  updatedAt: string;
};

export type UpdateOrgAdminProfileRequest = {
  legalName?: string;
  tradingName?: string;
  contactEmail?: string;
  contactPhone?: string;
  timeZone?: string;
  tagline?: string;
  brandColor?: string;
  logoData?: string | null;
};

export type ConfigurableRoleCode = "MANAGER" | "ROSTERING_EXPERT" | "EMPLOYEE";

export type OrgRoleItem = {
  id: string;
  code: ConfigurableRoleCode;
  name: string;
  capabilities: Record<string, boolean>;
};

export type OrgRolesResponse = {
  roles: OrgRoleItem[];
};

export type UpdateOrgRolesRequest = {
  roles: Array<{
    code: ConfigurableRoleCode;
    capabilities: Record<string, boolean>;
  }>;
};

export type TeamMemberRole = {
  code: string;
  name: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  status:
    | "INVITED"
    | "PROCESSING"
    | "SUBMITTED"
    | "VERIFIED"
    | "RESTRICTED"
    | "ACTIVE"
    | "DEACTIVATED";
  serviceLine?: string | null;
  role: TeamMemberRole | null;
  createdAt: string;
};

export type TeamMembersResponse = {
  members: TeamMember[];
};

export type RegisterTeamMemberRequest = {
  name: string;
  email: string;
  role: ConfigurableRoleCode;
  serviceLine: "NDIS" | "AGED_CARE" | "FIELD_SERVICES";
};

export type RegisterTeamMemberResponse = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: TeamMemberRole;
  inviteEmail?: { queued: boolean; sent?: boolean; error?: string };
};

export type AcceptInviteRequest = {
  token: string;
  password: string;
};

export type AcceptInviteResponse = {
  success: boolean;
  email: string;
};

export type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
};

export type OnboardingProfileResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
    role: string | null;
    roleName: string | null;
    serviceLine?: string | null;
  };
  organisation: {
    id: string;
    legalName: string;
    tradingName: string | null;
  } | null;
  profile: {
    data: Record<string, unknown>;
    currentStep: number;
    submittedAt: string | null;
    updatedAt: string | null;
  };
};

export type SaveOnboardingRequest = {
  data: Record<string, unknown>;
  currentStep: number;
};

export type SubmitOnboardingResponse = {
  profile: OnboardingProfileResponse["profile"];
  user: AuthUser;
};

export type MemberOnboardingReviewResponse = {
  member: {
    id: string;
    name: string;
    email: string;
    status: TeamMember["status"];
    serviceLine?: string | null;
    role: TeamMemberRole | null;
    createdAt: string;
  };
  profile: OnboardingProfileResponse["profile"] | null;
};

export type TeamMemberDetail = TeamMember & {
  updatedAt: string;
};

export type UpdateTeamMemberRequest = {
  name?: string;
  email?: string;
  role?: ConfigurableRoleCode;
  status?: TeamMember["status"];
  serviceLine?: RegisterTeamMemberRequest["serviceLine"];
};

export type PlatformModule = {
  code: string;
  name: string;
  isOperational: boolean;
  sortOrder: number;
};

export type PlatformEntitlement = {
  id: string;
  organisationId: string;
  organisationName: string;
  moduleCode: string;
  moduleName: string;
  ceilingGranted: boolean;
  enabled: boolean;
  grantedAt: string;
};

export type PlatformInvite = {
  id: string;
  name: string;
  email: string;
  status: string;
  organisation: string;
  role: string;
  invitedAt: string;
  pendingPasswordChange: boolean;
};

export type PlatformHealth = {
  status: string;
  services: {
    api: string;
    database: string;
    email: string;
  };
  checkedAt: string;
};

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: unknown;
  afterJson: unknown;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
  organisation?: {
    id: string;
    legalName: string;
    tradingName: string | null;
  } | null;
};

export type WorkforceProfile = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  roleName: string | null;
  status: string;
  organisationName: string | null;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  languages: string;
  bio: string;
};

export type UpdateWorkforceProfileRequest = {
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender?: string;
  languages?: string;
  bio?: string;
};

export type UploadOnboardingDocumentRequest = {
  docType: string;
  file: File;
};

export type UploadedFileMeta = {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  storedName: string;
};

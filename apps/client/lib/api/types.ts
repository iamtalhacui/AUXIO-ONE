export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  organisationId?: string | null;
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
  orgAdminPassword: string;
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

export type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
};

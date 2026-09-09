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
    firstName: string;
    lastName: string;
    email: string;
    status: UserStatus;
  } | null;
};

export type SetupAccountRequest = {
  token: string;
  password: string;
};

export type SetupAccountResponse = {
  message: string;
  email: string;
};

export type OrgUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: UserStatus;
  organisationId: string;
};

export type OrgSummary = {
  id: string;
  name: string;
  timezone: string;
  email: string;
  phone: string | null;
  plan: OrgPlan;
  status: OrgStatus;
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

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
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

export type CreateOrganisationRequest = {
  legalName: string;
  tradingName?: string;
  contactEmail: string;
  contactPhone?: string;
  timeZone: string;
  moduleCeilingCodes: string[];
  orgAdminEmail: string;
  orgAdminName: string;
};

export type CreateOrganisationResponse = {
  organisation: {
    id: string;
    legalName: string;
    tradingName: string | null;
    contactEmail: string;
  };
  orgAdmin: {
    id: string;
    email: string;
    name: string;
  };
};

export type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
};

export type RequestAuthUser = {
  sub: string;
  email: string;
  role?: string;
  organisationId?: string | null;
  status?: string;
};

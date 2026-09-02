import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  AcceptInviteRequest,
  AcceptInviteResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CreateOrganisationRequest,
  CreateOrganisationResponse,
  LoginRequest,
  LoginResponse,
  OrganisationDetail,
  OrganisationListItem,
  OrgModuleEntitlement,
  OrgAdminProfile,
  OrgRolesResponse,
  RegisterTeamMemberRequest,
  RegisterTeamMemberResponse,
  SaveOnboardingRequest,
  SubmitOnboardingResponse,
  OnboardingProfileResponse,
  MemberOnboardingReviewResponse,
  UploadOnboardingDocumentRequest,
  UploadedFileMeta,
  TeamMember,
  TeamMemberDetail,
  TeamMembersResponse,
  UpdateTeamMemberRequest,
  UpdateWorkforceProfileRequest,
  WorkforceProfile,
  PlatformModule,
  PlatformEntitlement,
  PlatformInvite,
  PlatformHealth,
  AuditEntry,
  ToggleModuleRequest,
  UpdateModuleCeilingRequest,
  UpdateOrgAdminProfileRequest,
  UpdateOrgRolesRequest,
  UpdateOrganisationRequest,
} from "@/lib/api/types";
import type { RootState } from "@/lib/store/store";
import { logout } from "@/lib/features/auth/authSlice";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const requestUrl = typeof args === "string" ? args : args.url;
    const hadToken = Boolean((api.getState() as RootState).auth.accessToken);
    if (hadToken && !requestUrl.includes("/auth/login") && !requestUrl.includes("/auth/accept-invite")) {
      api.dispatch(logout());
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Organisation", "OrgModules", "OrgProfile", "OrgRoles", "OrgTeam", "Onboarding", "Platform"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),
    acceptInvite: builder.mutation<AcceptInviteResponse, AcceptInviteRequest>({
      query: (body) => ({
        url: "/auth/accept-invite",
        method: "POST",
        body,
      }),
    }),
    createOrganisation: builder.mutation<
      CreateOrganisationResponse,
      CreateOrganisationRequest
    >({
      query: (body) => ({
        url: "/organisations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Organisation", id: "LIST" }],
    }),
    listOrganisations: builder.query<OrganisationListItem[], void>({
      query: () => "/organisations",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Organisation" as const, id })),
              { type: "Organisation", id: "LIST" },
            ]
          : [{ type: "Organisation", id: "LIST" }],
    }),
    getOrganisation: builder.query<OrganisationDetail, string>({
      query: (id) => `/organisations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Organisation", id }],
    }),
    updateOrganisation: builder.mutation<
      OrganisationDetail,
      { id: string; body: UpdateOrganisationRequest }
    >({
      query: ({ id, body }) => ({
        url: `/organisations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Organisation", id },
        { type: "Organisation", id: "LIST" },
      ],
    }),
    updateModuleCeiling: builder.mutation<
      OrganisationDetail,
      { id: string; body: UpdateModuleCeilingRequest }
    >({
      query: ({ id, body }) => ({
        url: `/organisations/${id}/module-ceiling`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Organisation", id },
        { type: "Organisation", id: "LIST" },
      ],
    }),
    listOrgModules: builder.query<OrgModuleEntitlement[], string>({
      query: (organisationId) => `/organisations/${organisationId}/modules`,
      providesTags: (_result, _error, organisationId) => [
        { type: "OrgModules", id: organisationId },
      ],
    }),
    toggleOrgModule: builder.mutation<
      OrgModuleEntitlement,
      { organisationId: string; moduleCode: string; enabled: boolean }
    >({
      query: ({ organisationId, moduleCode, enabled }) => ({
        url: `/organisations/${organisationId}/modules/${moduleCode}`,
        method: "PATCH",
        body: { enabled } satisfies ToggleModuleRequest,
      }),
      invalidatesTags: (_result, _error, { organisationId }) => [
        { type: "OrgModules", id: organisationId },
      ],
    }),
    getMyOrgProfile: builder.query<OrgAdminProfile, void>({
      query: () => "/organisations/me/profile",
      providesTags: [{ type: "OrgProfile", id: "ME" }],
    }),
    updateMyOrgProfile: builder.mutation<OrgAdminProfile, UpdateOrgAdminProfileRequest>({
      query: (body) => ({
        url: "/organisations/me/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "OrgProfile", id: "ME" }],
    }),
    getOrgRoles: builder.query<OrgRolesResponse, string>({
      query: (organisationId) => `/organisations/${organisationId}/roles`,
      providesTags: (_result, _error, organisationId) => [
        { type: "OrgRoles", id: organisationId },
      ],
    }),
    updateOrgRoles: builder.mutation<
      OrgRolesResponse,
      { organisationId: string; roles: UpdateOrgRolesRequest["roles"] }
    >({
      query: ({ organisationId, roles }) => ({
        url: `/organisations/${organisationId}/roles`,
        method: "PUT",
        body: { roles },
      }),
      invalidatesTags: (_result, _error, { organisationId }) => [
        { type: "OrgRoles", id: organisationId },
      ],
    }),
    resetOrgRoles: builder.mutation<OrgRolesResponse, string>({
      query: (organisationId) => ({
        url: `/organisations/${organisationId}/roles/reset`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, organisationId) => [
        { type: "OrgRoles", id: organisationId },
      ],
    }),
    listTeamMembers: builder.query<TeamMembersResponse, void>({
      query: () => "/organisations/me/team",
      providesTags: [{ type: "OrgTeam", id: "LIST" }],
    }),
    registerTeamMember: builder.mutation<RegisterTeamMemberResponse, RegisterTeamMemberRequest>({
      query: (body) => ({
        url: "/organisations/me/team/register",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "OrgTeam", id: "LIST" }],
    }),
    getMyOnboarding: builder.query<OnboardingProfileResponse, void>({
      query: () => "/onboarding/me",
      providesTags: [{ type: "Onboarding", id: "ME" }],
    }),
    saveOnboarding: builder.mutation<
      OnboardingProfileResponse["profile"],
      SaveOnboardingRequest
    >({
      query: (body) => ({
        url: "/onboarding/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Onboarding", id: "ME" }],
    }),
    submitOnboarding: builder.mutation<SubmitOnboardingResponse, void>({
      query: () => ({
        url: "/onboarding/me/submit",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Onboarding", id: "ME" }],
    }),
    uploadOnboardingDocument: builder.mutation<
      UploadedFileMeta,
      UploadOnboardingDocumentRequest
    >({
      query: ({ docType, file }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: `/onboarding/me/documents/${docType}`,
          method: "POST",
          body,
        };
      },
    }),
    getMemberOnboarding: builder.query<MemberOnboardingReviewResponse, string>({
      query: (memberId) => `/organisations/me/team/${memberId}/onboarding`,
      providesTags: (_result, _error, memberId) => [
        { type: "Onboarding", id: memberId },
      ],
    }),
    getTeamMember: builder.query<TeamMemberDetail, string>({
      query: (memberId) => `/organisations/me/team/${memberId}`,
      providesTags: (_result, _error, memberId) => [
        { type: "OrgTeam", id: memberId },
      ],
    }),
    updateTeamMember: builder.mutation<
      TeamMemberDetail,
      { memberId: string; body: UpdateTeamMemberRequest }
    >({
      query: ({ memberId, body }) => ({
        url: `/organisations/me/team/${memberId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { memberId }) => [
        { type: "OrgTeam", id: "LIST" },
        { type: "OrgTeam", id: memberId },
        { type: "Onboarding", id: memberId },
      ],
    }),
    getMyWorkforceProfile: builder.query<WorkforceProfile, void>({
      query: () => "/onboarding/me/profile",
      providesTags: [{ type: "Onboarding", id: "PROFILE" }],
    }),
    updateMyWorkforceProfile: builder.mutation<WorkforceProfile, UpdateWorkforceProfileRequest>({
      query: (body) => ({
        url: "/onboarding/me/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [
        { type: "Onboarding", id: "PROFILE" },
        { type: "Onboarding", id: "ME" },
      ],
    }),
    approveTeamMember: builder.mutation<TeamMember, string>({
      query: (memberId) => ({
        url: `/organisations/me/team/${memberId}/approve`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "OrgTeam", id: "LIST" },
        { type: "Onboarding", id: "LIST" },
      ],
    }),
    reopenTeamMember: builder.mutation<TeamMember, { memberId: string; reason: string }>({
      query: ({ memberId, reason }) => ({
        url: `/organisations/me/team/${memberId}/reopen`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { memberId }) => [
        { type: "OrgTeam", id: "LIST" },
        { type: "OrgTeam", id: memberId },
        { type: "Onboarding", id: memberId },
      ],
    }),
    getPlatformHealth: builder.query<PlatformHealth, void>({
      query: () => "/platform/health",
      providesTags: [{ type: "Platform", id: "HEALTH" }],
    }),
    listPlatformModules: builder.query<PlatformModule[], void>({
      query: () => "/platform/modules",
      providesTags: [{ type: "Platform", id: "MODULES" }],
    }),
    listPlatformEntitlements: builder.query<PlatformEntitlement[], void>({
      query: () => "/platform/entitlements",
      providesTags: [{ type: "Platform", id: "ENTITLEMENTS" }],
    }),
    listPlatformInvites: builder.query<PlatformInvite[], void>({
      query: () => "/platform/invites",
      providesTags: [{ type: "Platform", id: "INVITES" }],
    }),
    listPlatformAudit: builder.query<AuditEntry[], void>({
      query: () => "/platform/audit",
      providesTags: [{ type: "Platform", id: "AUDIT" }],
    }),
  }),
});

export const {
  useLoginMutation,
  useChangePasswordMutation,
  useAcceptInviteMutation,
  useCreateOrganisationMutation,
  useListOrganisationsQuery,
  useGetOrganisationQuery,
  useUpdateOrganisationMutation,
  useUpdateModuleCeilingMutation,
  useListOrgModulesQuery,
  useToggleOrgModuleMutation,
  useGetMyOrgProfileQuery,
  useUpdateMyOrgProfileMutation,
  useGetOrgRolesQuery,
  useUpdateOrgRolesMutation,
  useResetOrgRolesMutation,
  useListTeamMembersQuery,
  useRegisterTeamMemberMutation,
  useGetMyOnboardingQuery,
  useSaveOnboardingMutation,
  useSubmitOnboardingMutation,
  useUploadOnboardingDocumentMutation,
  useGetMemberOnboardingQuery,
  useGetTeamMemberQuery,
  useUpdateTeamMemberMutation,
  useGetMyWorkforceProfileQuery,
  useUpdateMyWorkforceProfileMutation,
  useApproveTeamMemberMutation,
  useReopenTeamMemberMutation,
  useGetPlatformHealthQuery,
  useListPlatformModulesQuery,
  useListPlatformEntitlementsQuery,
  useListPlatformInvitesQuery,
  useListPlatformAuditQuery,
} = api;

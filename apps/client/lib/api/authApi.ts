import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  OrgLoginResponse,
  OrgMeResponse,
  OrgModule,
  OrgTeamMember,
  RegisterTeamMemberRequest,
  UpdateTeamMemberRequest,
  SetupAccountRequest,
  SetupAccountResponse,
  OnboardingMeResponse,
  SaveOnboardingDraftRequest,
  OnboardingDocumentMeta,
  OnboardingAdminDetailResponse,
  ReviewOnboardingRequest,
  OnboardingStatus,
} from "@/lib/api/types";
import { isMaintenanceError, rememberMaintenanceLogout } from "@/lib/api/getErrorMessage";
import { logoutOrg } from "@/lib/store/orgAuthSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000",
  prepareHeaders: (headers, { getState }) => {
    const token = (
      getState() as { orgAuth: { accessToken: string | null } }
    ).orgAuth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 || isMaintenanceError(result.error)) {
    if (isMaintenanceError(result.error)) rememberMaintenanceLogout();
    api.dispatch(logoutOrg());
  }
  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["OrgModules", "OrgTeam", "OnboardingMe", "OnboardingAdmin"],
  endpoints: (builder) => ({
    setupAccount: builder.mutation<SetupAccountResponse, SetupAccountRequest>({
      query: (body) => ({
        url: "/auth/setup",
        method: "POST",
        body,
      }),
    }),
    orgLogin: builder.mutation<OrgLoginResponse, { email: string; password: string }>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    orgMe: builder.query<OrgMeResponse, string>({
      query: () => "/auth/me",
    }),
    listOrgModules: builder.query<OrgModule[], void>({
      query: () => "/organisation/modules",
      providesTags: ["OrgModules"],
    }),
    setOrgModuleEnabled: builder.mutation<OrgModule, { code: string; enabled: boolean }>({
      query: ({ code, enabled }) => ({
        url: `/organisation/modules/${code}`,
        method: "PATCH",
        body: { enabled },
      }),
      invalidatesTags: ["OrgModules"],
    }),
    listOrgTeam: builder.query<OrgTeamMember[], void>({
      query: () => "/organisation/team",
      providesTags: ["OrgTeam"],
    }),
    registerTeamMember: builder.mutation<OrgTeamMember, RegisterTeamMemberRequest>({
      query: (body) => ({
        url: "/organisation/team",
        method: "POST",
        body,
      }),
      invalidatesTags: ["OrgTeam"],
    }),
    getOrgTeamMember: builder.query<OrgTeamMember, string>({
      query: (id) => `/organisation/team/${id}`,
      providesTags: (_result, _error, id) => [{ type: "OrgTeam", id }],
    }),
    updateTeamMember: builder.mutation<
      OrgTeamMember,
      { id: string } & UpdateTeamMemberRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/organisation/team/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ["OrgTeam", { type: "OrgTeam", id }],
    }),
    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),
    getOnboardingMe: builder.query<OnboardingMeResponse, void>({
      query: () => "/onboarding/me",
      providesTags: ["OnboardingMe"],
    }),
    saveOnboardingDraft: builder.mutation<
      { onboardingStatus: OnboardingStatus; editable: boolean; submission: OnboardingMeResponse["submission"] },
      SaveOnboardingDraftRequest
    >({
      query: (body) => ({
        url: "/onboarding/me/draft",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["OnboardingMe"],
    }),
    submitOnboarding: builder.mutation<
      { onboardingStatus: OnboardingStatus; editable: boolean; submission: OnboardingMeResponse["submission"] },
      void
    >({
      query: () => ({
        url: "/onboarding/me/submit",
        method: "POST",
      }),
      invalidatesTags: ["OnboardingMe", "OrgTeam"],
    }),
    uploadOnboardingDocument: builder.mutation<OnboardingDocumentMeta, { fieldKey: string; file: File }>({
      query: ({ fieldKey, file }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: `/onboarding/me/documents/${fieldKey}`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["OnboardingMe"],
    }),
    deleteOnboardingDocument: builder.mutation<{ message: string }, string>({
      query: (documentId) => ({
        url: `/onboarding/me/documents/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OnboardingMe"],
    }),
    getAdminOnboarding: builder.query<OnboardingAdminDetailResponse, string>({
      query: (userId) => `/organisation/onboarding/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: "OnboardingAdmin", id: userId }],
    }),
    reviewOnboarding: builder.mutation<
      { onboardingStatus: OnboardingStatus },
      { userId: string } & ReviewOnboardingRequest
    >({
      query: ({ userId, ...body }) => ({
        url: `/organisation/onboarding/${userId}/review`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["OnboardingAdmin", "OrgTeam", "OnboardingMe"],
    }),
  }),
});

export const {
  useSetupAccountMutation,
  useOrgLoginMutation,
  useOrgMeQuery,
  useListOrgModulesQuery,
  useSetOrgModuleEnabledMutation,
  useListOrgTeamQuery,
  useRegisterTeamMemberMutation,
  useGetOrgTeamMemberQuery,
  useUpdateTeamMemberMutation,
  useChangePasswordMutation,
  useGetOnboardingMeQuery,
  useSaveOnboardingDraftMutation,
  useSubmitOnboardingMutation,
  useUploadOnboardingDocumentMutation,
  useDeleteOnboardingDocumentMutation,
  useGetAdminOnboardingQuery,
  useReviewOnboardingMutation,
} = authApi;

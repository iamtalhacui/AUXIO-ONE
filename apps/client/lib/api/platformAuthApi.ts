import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  DemoRequest,
  DemoRequestStatus,
  PlatformAuditEntry,
  PlatformEntitlement,
  PlatformInvite,
  PlatformLoginResponse,
  PlatformModule,
  PlatformOrganisation,
  PlatformOrganisationDetail,
  PlatformOverview,
  PlatformSettings,
  PlatformUser,
  RegisterOrganisationRequest,
  RegisterOrganisationResponse,
} from "@/lib/api/types";
import { logoutPlatform } from "@/lib/store/platformAuthSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000",
  prepareHeaders: (headers, { getState }) => {
    const token = (
      getState() as { platformAuth: { accessToken: string | null } }
    ).platformAuth.accessToken;
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
  if (result.error?.status === 401) {
    api.dispatch(logoutPlatform());
  }
  return result;
};

export const platformAuthApi = createApi({
  reducerPath: "platformAuthApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "Organisations",
    "Audit",
    "Modules",
    "Entitlements",
    "Invites",
    "Settings",
    "Demos",
    "Overview",
  ],
  endpoints: (builder) => ({
    platformLogin: builder.mutation<
      PlatformLoginResponse,
      { email: string; password: string }
    >({
      query: (body) => ({
        url: "/platform/auth/login",
        method: "POST",
        body,
      }),
    }),
    platformMe: builder.query<PlatformUser, void>({
      query: () => "/platform/auth/me",
    }),
    getPlatformOverview: builder.query<PlatformOverview, void>({
      query: () => "/platform/overview",
      providesTags: ["Overview"],
    }),
    listOrganisations: builder.query<PlatformOrganisation[], void>({
      query: () => "/platform/organisations",
      providesTags: ["Organisations"],
    }),
    getOrganisation: builder.query<PlatformOrganisationDetail, string>({
      query: (id) => `/platform/organisations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Organisations", id }],
    }),
    approveOrgAdmin: builder.mutation<PlatformOrganisationDetail, string>({
      query: (id) => ({
        url: `/platform/organisations/${id}/approve-admin`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Organisations",
        { type: "Organisations", id },
        "Audit",
        "Overview",
      ],
    }),
    rejectOrgAdmin: builder.mutation<PlatformOrganisationDetail, string>({
      query: (id) => ({
        url: `/platform/organisations/${id}/reject-admin`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Organisations",
        { type: "Organisations", id },
        "Audit",
        "Overview",
      ],
    }),
    changeOrgAdminEmail: builder.mutation<
      PlatformOrganisationDetail,
      {
        id: string;
        adminEmail: string;
        adminFirstName?: string;
        adminLastName?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/platform/organisations/${id}/admin-email`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Organisations",
        { type: "Organisations", id },
        "Audit",
        "Invites",
        "Overview",
      ],
    }),
    registerOrganisation: builder.mutation<
      RegisterOrganisationResponse,
      RegisterOrganisationRequest
    >({
      query: (body) => ({
        url: "/platform/organisations",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "Organisations",
        "Audit",
        "Invites",
        "Entitlements",
        "Overview",
      ],
    }),
    listPlatformModules: builder.query<PlatformModule[], void>({
      query: () => "/platform/modules",
      providesTags: ["Modules"],
    }),
    listPlatformAudit: builder.query<PlatformAuditEntry[], void>({
      query: () => "/platform/audit",
      providesTags: ["Audit"],
    }),
    listPlatformEntitlements: builder.query<PlatformEntitlement[], void>({
      query: () => "/platform/entitlements",
      providesTags: ["Entitlements"],
    }),
    listPlatformInvites: builder.query<PlatformInvite[], void>({
      query: () => "/platform/invites",
      providesTags: ["Invites"],
    }),
    getPlatformSettings: builder.query<PlatformSettings, void>({
      query: () => "/platform/settings",
      providesTags: ["Settings"],
    }),
    updatePlatformSettings: builder.mutation<PlatformSettings, { maintenanceMode: boolean }>({
      query: (body) => ({
        url: "/platform/settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Settings", "Audit", "Overview"],
    }),
    listDemoRequests: builder.query<DemoRequest[], void>({
      query: () => "/platform/demos",
      providesTags: ["Demos"],
    }),
    getDemoRequest: builder.query<DemoRequest, string>({
      query: (id) => `/platform/demos/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Demos", id }],
    }),
    updateDemoRequestStatus: builder.mutation<
      DemoRequest,
      { id: string; status: DemoRequestStatus }
    >({
      query: ({ id, status }) => ({
        url: `/platform/demos/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Demos",
        { type: "Demos", id },
        "Overview",
      ],
    }),
  }),
});

export const {
  usePlatformLoginMutation,
  usePlatformMeQuery,
  useGetPlatformOverviewQuery,
  useListOrganisationsQuery,
  useGetOrganisationQuery,
  useApproveOrgAdminMutation,
  useRejectOrgAdminMutation,
  useChangeOrgAdminEmailMutation,
  useRegisterOrganisationMutation,
  useListPlatformModulesQuery,
  useListPlatformAuditQuery,
  useListPlatformEntitlementsQuery,
  useListPlatformInvitesQuery,
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useListDemoRequestsQuery,
  useGetDemoRequestQuery,
  useUpdateDemoRequestStatusMutation,
} = platformAuthApi;

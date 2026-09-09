import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  PlatformAuditEntry,
  PlatformEntitlement,
  PlatformInvite,
  PlatformLoginResponse,
  PlatformModule,
  PlatformOrganisation,
  PlatformOrganisationDetail,
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
  tagTypes: ["Organisations", "Audit", "Modules", "Entitlements", "Invites", "Settings"],
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
    listOrganisations: builder.query<PlatformOrganisation[], void>({
      query: () => "/platform/organisations",
      providesTags: ["Organisations"],
    }),
    getOrganisation: builder.query<PlatformOrganisationDetail, string>({
      query: (id) => `/platform/organisations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Organisations", id }],
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
      invalidatesTags: ["Organisations", "Audit", "Invites", "Entitlements"],
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
      invalidatesTags: ["Settings", "Audit"],
    }),
  }),
});

export const {
  usePlatformLoginMutation,
  usePlatformMeQuery,
  useListOrganisationsQuery,
  useGetOrganisationQuery,
  useRegisterOrganisationMutation,
  useListPlatformModulesQuery,
  useListPlatformAuditQuery,
  useListPlatformEntitlementsQuery,
  useListPlatformInvitesQuery,
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
} = platformAuthApi;

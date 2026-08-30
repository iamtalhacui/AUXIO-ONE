import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
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
  ToggleModuleRequest,
  UpdateModuleCeilingRequest,
  UpdateOrgAdminProfileRequest,
  UpdateOrganisationRequest,
} from "@/lib/api/types";
import type { RootState } from "@/lib/store/store";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Organisation", "OrgModules", "OrgProfile"],
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
  }),
});

export const {
  useLoginMutation,
  useChangePasswordMutation,
  useCreateOrganisationMutation,
  useListOrganisationsQuery,
  useGetOrganisationQuery,
  useUpdateOrganisationMutation,
  useUpdateModuleCeilingMutation,
  useListOrgModulesQuery,
  useToggleOrgModuleMutation,
  useGetMyOrgProfileQuery,
  useUpdateMyOrgProfileMutation,
} = api;

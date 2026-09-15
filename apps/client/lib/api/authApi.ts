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
  OrgSummary,
  OrgTeamMember,
  RegisterTeamMemberRequest,
  UpdateTeamMemberRequest,
  UpdateOrganisationRequest,
  SetupAccountRequest,
  SetupAccountResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OnboardingMeResponse,
  SaveOnboardingDraftRequest,
  OnboardingDocumentMeta,
  OnboardingAdminDetailResponse,
  ReviewOnboardingRequest,
  OnboardingStatus,
  Customer,
  CreateCustomerRequest,
  CrmOpportunity,
  CrmPipelineSummary,
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
  CustomerDocumentMeta,
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
  tagTypes: [
    "OrgModules",
    "OrgTeam",
    "OnboardingMe",
    "OnboardingAdmin",
    "Customers",
    "CrmOpportunities",
    "Organisation",
  ],
  endpoints: (builder) => ({
    setupAccount: builder.mutation<SetupAccountResponse, SetupAccountRequest>({
      query: (body) => ({
        url: "/auth/setup",
        method: "POST",
        body,
      }),
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
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
    getOrganisation: builder.query<OrgSummary, void>({
      query: () => "/organisation",
      providesTags: ["Organisation"],
    }),
    updateOrganisation: builder.mutation<OrgSummary, UpdateOrganisationRequest>({
      query: (body) => ({
        url: "/organisation",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Organisation"],
    }),
    uploadOrganisationLogo: builder.mutation<OrgSummary, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: "/organisation/logo",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Organisation"],
    }),
    deleteOrganisationLogo: builder.mutation<OrgSummary, void>({
      query: () => ({
        url: "/organisation/logo",
        method: "DELETE",
      }),
      invalidatesTags: ["Organisation"],
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
    updatePersonalDetails: builder.mutation<
      {
        onboardingStatus: OnboardingStatus;
        editable: boolean;
        submission: OnboardingMeResponse["submission"];
      },
      Partial<
        Record<
          | "preferredName"
          | "dateOfBirth"
          | "mobile"
          | "homeAddress"
          | "emergencyName"
          | "emergencyPhone",
          string
        >
      >
    >({
      query: (body) => ({
        url: "/onboarding/me/personal-details",
        method: "PATCH",
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

    // ── Customers (CUSTOMERS module) ──
    listCustomers: builder.query<Customer[], void>({
      query: () => "/organisation/customers",
      providesTags: ["Customers"],
    }),
    getCustomer: builder.query<Customer, string>({
      query: (id) => `/organisation/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Customers", id }],
    }),
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (body) => ({
        url: "/organisation/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customers"],
    }),
    updateCustomer: builder.mutation<Customer, { id: string } & Partial<CreateCustomerRequest>>({
      query: ({ id, ...body }) => ({
        url: `/organisation/customers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ["Customers", { type: "Customers", id }],
    }),
    activateCustomer: builder.mutation<Customer, string>({
      query: (id) => ({
        url: `/organisation/customers/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => ["Customers", { type: "Customers", id }],
    }),
    uploadCustomerMandatoryDoc: builder.mutation<
      CustomerDocumentMeta,
      { customerId: string; fieldKey: string; file: File }
    >({
      query: ({ customerId, fieldKey, file }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: `/organisation/customers/${customerId}/documents/mandatory/${fieldKey}`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: (_r, _e, { customerId }) => [
        "Customers",
        { type: "Customers", id: customerId },
      ],
    }),
    uploadCustomerOptionalDoc: builder.mutation<
      CustomerDocumentMeta,
      { customerId: string; label: string; file: File }
    >({
      query: ({ customerId, label, file }) => {
        const body = new FormData();
        body.append("file", file);
        body.append("label", label);
        return {
          url: `/organisation/customers/${customerId}/documents/optional`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: (_r, _e, { customerId }) => [
        "Customers",
        { type: "Customers", id: customerId },
      ],
    }),
    deleteCustomerDoc: builder.mutation<
      { message: string },
      { customerId: string; documentId: string }
    >({
      query: ({ customerId, documentId }) => ({
        url: `/organisation/customers/${customerId}/documents/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { customerId }) => [
        "Customers",
        { type: "Customers", id: customerId },
      ],
    }),

    // ── CRM opportunities ──
    listCrmOpportunities: builder.query<CrmOpportunity[], void>({
      query: () => "/organisation/crm/opportunities",
      providesTags: ["CrmOpportunities"],
    }),
    getCrmPipeline: builder.query<CrmPipelineSummary, void>({
      query: () => "/organisation/crm/opportunities/pipeline",
      providesTags: ["CrmOpportunities"],
    }),
    createCrmOpportunity: builder.mutation<CrmOpportunity, CreateOpportunityRequest>({
      query: (body) => ({
        url: "/organisation/crm/opportunities",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CrmOpportunities"],
    }),
    updateCrmOpportunity: builder.mutation<
      CrmOpportunity,
      { id: string } & UpdateOpportunityRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/organisation/crm/opportunities/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CrmOpportunities"],
    }),
    convertCrmOpportunity: builder.mutation<
      { opportunityId: string; customer: Customer; message: string },
      string
    >({
      query: (id) => ({
        url: `/organisation/crm/opportunities/${id}/convert`,
        method: "POST",
      }),
      invalidatesTags: ["CrmOpportunities", "Customers"],
    }),
  }),
});

export const {
  useSetupAccountMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useOrgLoginMutation,
  useOrgMeQuery,
  useGetOrganisationQuery,
  useUpdateOrganisationMutation,
  useUploadOrganisationLogoMutation,
  useDeleteOrganisationLogoMutation,
  useListOrgModulesQuery,
  useSetOrgModuleEnabledMutation,
  useListOrgTeamQuery,
  useRegisterTeamMemberMutation,
  useGetOrgTeamMemberQuery,
  useUpdateTeamMemberMutation,
  useChangePasswordMutation,
  useGetOnboardingMeQuery,
  useSaveOnboardingDraftMutation,
  useUpdatePersonalDetailsMutation,
  useSubmitOnboardingMutation,
  useUploadOnboardingDocumentMutation,
  useDeleteOnboardingDocumentMutation,
  useGetAdminOnboardingQuery,
  useReviewOnboardingMutation,
  useListCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useActivateCustomerMutation,
  useUploadCustomerMandatoryDocMutation,
  useUploadCustomerOptionalDocMutation,
  useDeleteCustomerDocMutation,
  useListCrmOpportunitiesQuery,
  useGetCrmPipelineQuery,
  useCreateCrmOpportunityMutation,
  useUpdateCrmOpportunityMutation,
  useConvertCrmOpportunityMutation,
} = authApi;

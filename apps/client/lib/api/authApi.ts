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
  OrgAdminOverview,
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
  ScheduleShift,
  ScheduleParticipantOption,
  ScheduleWorkerOption,
  MatchCandidate,
  CreateScheduleShiftRequest,
  CreateScheduleShiftResponse,
  RecurrencePreview,
  UpdateScheduleShiftRequest,
  WorkerAvailabilityPayload,
  ParticipantCareView,
  ServiceLineTaskCatalogue,
  NotificationFeed,
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
  // Cross-user updates (e.g. employee finishes → admin sees it) need a refetch.
  // setupListeners in StoreProvider enables focus/reconnect; this turns them on.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 15,
  tagTypes: [
    "OrgModules",
    "OrgTeam",
    "OnboardingMe",
    "OnboardingAdmin",
    "Customers",
    "CrmOpportunities",
    "Organisation",
    "ScheduleShifts",
    "ScheduleWorkers",
    "ScheduleParticipants",
    "MyAvailability",
    "MyShifts",
    "MatchCandidates",
    "ParticipantCare",
    "PendingApprovals",
    "ServiceLineTasks",
    "OrgOverview",
    "Notifications",
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
    getOrgAdminOverview: builder.query<OrgAdminOverview, void>({
      query: () => "/organisation/overview",
      providesTags: ["OrgOverview"],
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
      invalidatesTags: ["OrgModules", "OrgOverview"],
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
      invalidatesTags: ["OrgTeam", "OrgOverview"],
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
      invalidatesTags: (_result, _error, { id }) => [
        "OrgTeam",
        "OrgOverview",
        { type: "OrgTeam", id },
      ],
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
      invalidatesTags: ["OnboardingMe", "OrgTeam", "OrgOverview"],
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
      invalidatesTags: ["OnboardingAdmin", "OrgTeam", "OnboardingMe", "OrgOverview"],
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

    // ── Schedule / rostering (SCHEDULE module — Phase A) ──

    listScheduleParticipants: builder.query<ScheduleParticipantOption[], void>({
      query: () => "/organisation/schedule/participants",
      providesTags: ["ScheduleParticipants"],
    }),
    listScheduleWorkers: builder.query<ScheduleWorkerOption[], void>({
      query: () => "/organisation/schedule/workers",
      providesTags: ["ScheduleWorkers"],
    }),
    listScheduleShifts: builder.query<
      ScheduleShift[],
      { from?: string; to?: string } | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.from) search.set("from", params.from);
        if (params?.to) search.set("to", params.to);
        const qs = search.toString();
        return `/organisation/schedule/shifts${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["ScheduleShifts"],
    }),
    getScheduleShift: builder.query<ScheduleShift, string>({
      query: (id) => `/organisation/schedule/shifts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ScheduleShifts", id }],
    }),
    previewRecurrence: builder.mutation<RecurrencePreview, CreateScheduleShiftRequest>({
      query: (body) => ({
        url: "/organisation/schedule/shifts/preview-recurrence",
        method: "POST",
        body,
      }),
    }),
    createScheduleShifts: builder.mutation<
      CreateScheduleShiftResponse,
      CreateScheduleShiftRequest
    >({
      query: (body) => ({
        url: "/organisation/schedule/shifts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ScheduleShifts"],
    }),
    updateScheduleShift: builder.mutation<
      { updatedCount: number; shift: ScheduleShift },
      { id: string } & UpdateScheduleShiftRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/organisation/schedule/shifts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ScheduleShifts", "MyShifts"],
    }),
    cancelScheduleShift: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/shifts/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["ScheduleShifts", "MyShifts", "MatchCandidates"],
    }),
    publishUnfilledShift: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/shifts/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: ["ScheduleShifts", "MatchCandidates"],
    }),
    publishOfferShift: builder.mutation<
      ScheduleShift,
      { id: string; workerId: string }
    >({
      query: ({ id, workerId }) => ({
        url: `/organisation/schedule/shifts/${id}/publish-offer`,
        method: "POST",
        body: { workerId },
      }),
      invalidatesTags: ["ScheduleShifts", "MyShifts", "MatchCandidates"],
    }),
    withdrawShiftOffer: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/shifts/${id}/withdraw-offer`,
        method: "POST",
      }),
      invalidatesTags: ["ScheduleShifts", "MyShifts", "MatchCandidates"],
    }),
    listMatchCandidates: builder.query<MatchCandidate[], string>({
      query: (id) => `/organisation/schedule/shifts/${id}/candidates`,
      providesTags: (_r, _e, id) => [{ type: "MatchCandidates", id }],
    }),

    // Employee schedule endpoints
    listMyShifts: builder.query<ScheduleShift[], void>({
      query: () => "/organisation/schedule/my/shifts",
      providesTags: ["MyShifts"],
    }),
    getMyShift: builder.query<ScheduleShift, string>({
      query: (id) => `/organisation/schedule/my/shifts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "MyShifts", id }],
    }),
    acceptShiftOffer: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/my/shifts/${id}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["MyShifts", "ScheduleShifts", "MatchCandidates"],
    }),
    declineShiftOffer: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/my/shifts/${id}/decline`,
        method: "POST",
      }),
      invalidatesTags: ["MyShifts", "ScheduleShifts", "MatchCandidates"],
    }),
    getParticipantCareView: builder.query<ParticipantCareView, string>({
      query: (customerId) => `/organisation/schedule/my/participants/${customerId}`,
      providesTags: (_r, _e, id) => [{ type: "ParticipantCare", id }],
    }),
    getMyAvailability: builder.query<WorkerAvailabilityPayload, void>({
      query: () => "/organisation/schedule/my/availability",
      providesTags: ["MyAvailability"],
    }),
    saveMyAvailability: builder.mutation<
      WorkerAvailabilityPayload,
      WorkerAvailabilityPayload
    >({
      query: (body) => ({
        url: "/organisation/schedule/my/availability",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MyAvailability", "MatchCandidates", "ScheduleWorkers"],
    }),

    // Phase B — employee execution
    startMyShift: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/my/shifts/${id}/start`,
        method: "POST",
      }),
      invalidatesTags: ["MyShifts", "ScheduleShifts"],
    }),
    completeMyShiftTask: builder.mutation<
      ScheduleShift,
      { shiftId: string; taskId: string }
    >({
      query: ({ shiftId, taskId }) => ({
        url: `/organisation/schedule/my/shifts/${shiftId}/tasks/${taskId}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["MyShifts"],
    }),
    saveMyProgressNote: builder.mutation<
      ScheduleShift,
      { shiftId: string; progressNote: string }
    >({
      query: ({ shiftId, progressNote }) => ({
        url: `/organisation/schedule/my/shifts/${shiftId}/progress-note`,
        method: "PUT",
        body: { progressNote },
      }),
      invalidatesTags: ["MyShifts"],
    }),
    finishMyShift: builder.mutation<
      ScheduleShift,
      { shiftId: string; finishReason?: string }
    >({
      query: ({ shiftId, finishReason }) => ({
        url: `/organisation/schedule/my/shifts/${shiftId}/finish`,
        method: "POST",
        body: { finishReason },
      }),
      invalidatesTags: ["MyShifts", "ScheduleShifts", "PendingApprovals", "OrgOverview"],
    }),

    // Org Admin — variance approvals + task catalogues
    listPendingShiftApprovals: builder.query<ScheduleShift[], void>({
      query: () => "/organisation/schedule/admin/pending-approvals",
      providesTags: ["PendingApprovals"],
    }),
    approvePendingShift: builder.mutation<
      ScheduleShift,
      { id: string; reviewNote?: string }
    >({
      query: ({ id, reviewNote }) => ({
        url: `/organisation/schedule/admin/shifts/${id}/approve`,
        method: "POST",
        body: { reviewNote },
      }),
      invalidatesTags: [
        "PendingApprovals",
        "MyShifts",
        "ScheduleShifts",
        "OrgOverview",
      ],
    }),
    rejectPendingShift: builder.mutation<
      ScheduleShift,
      { id: string; reviewNote: string }
    >({
      query: ({ id, reviewNote }) => ({
        url: `/organisation/schedule/admin/shifts/${id}/reject`,
        method: "POST",
        body: { reviewNote },
      }),
      invalidatesTags: [
        "PendingApprovals",
        "MyShifts",
        "ScheduleShifts",
        "OrgOverview",
      ],
    }),
    listServiceLineTasks: builder.query<ServiceLineTaskCatalogue[], void>({
      query: () => "/organisation/schedule/admin/service-line-tasks",
      providesTags: ["ServiceLineTasks"],
    }),
    saveServiceLineTasks: builder.mutation<
      ServiceLineTaskCatalogue[],
      { serviceLine: string; labels: string[] }
    >({
      query: (body) => ({
        url: "/organisation/schedule/admin/service-line-tasks",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ServiceLineTasks"],
    }),

    // ── Notifications (global bell / drawer) ──
    listNotifications: builder.query<NotificationFeed, void>({
      query: () => "/organisation/notifications",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/organisation/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/organisation/notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
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
  useGetOrgAdminOverviewQuery,
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
  useListScheduleParticipantsQuery,
  useListScheduleWorkersQuery,
  useListScheduleShiftsQuery,
  useGetScheduleShiftQuery,
  usePreviewRecurrenceMutation,
  useCreateScheduleShiftsMutation,
  useUpdateScheduleShiftMutation,
  useCancelScheduleShiftMutation,
  usePublishUnfilledShiftMutation,
  usePublishOfferShiftMutation,
  useWithdrawShiftOfferMutation,
  useListMatchCandidatesQuery,
  useListMyShiftsQuery,
  useGetMyShiftQuery,
  useAcceptShiftOfferMutation,
  useDeclineShiftOfferMutation,
  useGetParticipantCareViewQuery,
  useGetMyAvailabilityQuery,
  useSaveMyAvailabilityMutation,
  useStartMyShiftMutation,
  useCompleteMyShiftTaskMutation,
  useSaveMyProgressNoteMutation,
  useFinishMyShiftMutation,
  useListPendingShiftApprovalsQuery,
  useApprovePendingShiftMutation,
  useRejectPendingShiftMutation,
  useListServiceLineTasksQuery,
  useSaveServiceLineTasksMutation,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = authApi;

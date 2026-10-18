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
  ManagerOverview,
  RosterOverview,
  EmployeeOverview,
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
  OnboardingAdminListItem,
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
  IncidentRecord,
  ListIncidentsParams,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  CreateIncidentActionRequest,
  UpdateIncidentActionRequest,
  IncidentActionItem,
  IncidentAttachmentMeta,
  OrgBillingSummary,
  OrganisationPayment,
  RolePermissionMatrixPayload,
  MaintenanceStatus,
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
    "ManagerOverview",
    "RosterOverview",
    "EmployeeOverview",
    "Notifications",
    "Incidents",
    "Payments",
    "RolePermissions",
    "MaintenanceStatus",
  ],
  endpoints: (builder) => ({
    getMaintenanceStatus: builder.query<MaintenanceStatus, void>({
      query: () => "/platform/public/maintenance",
      providesTags: ["MaintenanceStatus"],
    }),
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
    getManagerOverview: builder.query<ManagerOverview, void>({
      query: () => "/organisation/manager/overview",
      providesTags: ["ManagerOverview"],
    }),
    getRosterOverview: builder.query<RosterOverview, void>({
      query: () => "/organisation/roster/overview",
      providesTags: ["RosterOverview"],
    }),
    getEmployeeOverview: builder.query<EmployeeOverview, void>({
      query: () => "/organisation/employee/overview",
      providesTags: ["EmployeeOverview"],
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
    getRolePermissions: builder.query<RolePermissionMatrixPayload, void>({
      query: () => "/organisation/role-permissions",
      providesTags: ["RolePermissions"],
    }),
    updateRolePermissions: builder.mutation<
      RolePermissionMatrixPayload,
      RolePermissionMatrixPayload
    >({
      query: (body) => ({
        url: "/organisation/role-permissions",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["RolePermissions"],
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
    listAdminOnboarding: builder.query<
      OnboardingAdminListItem[],
      { status?: OnboardingStatus } | void
    >({
      query: (params) => ({
        url: "/organisation/onboarding",
        params: params?.status ? { status: params.status } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((row) => ({
                type: "OnboardingAdmin" as const,
                id: row.user.id,
              })),
              { type: "OnboardingAdmin" as const, id: "LIST" },
            ]
          : [{ type: "OnboardingAdmin" as const, id: "LIST" }],
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
      invalidatesTags: [
        "OnboardingAdmin",
        "OrgTeam",
        "OnboardingMe",
        "OrgOverview",
        "ManagerOverview",
      ],
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
      invalidatesTags: ["Customers", "ManagerOverview"],
    }),
    updateCustomer: builder.mutation<Customer, { id: string } & Partial<CreateCustomerRequest>>({
      query: ({ id, ...body }) => ({
        url: `/organisation/customers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "Customers",
        "ManagerOverview",
        { type: "Customers", id },
      ],
    }),
    activateCustomer: builder.mutation<Customer, string>({
      query: (id) => ({
        url: `/organisation/customers/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [
        "Customers",
        "ManagerOverview",
        { type: "Customers", id },
      ],
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
        "ManagerOverview",
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
        "ManagerOverview",
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
        "ManagerOverview",
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
      invalidatesTags: ["CrmOpportunities", "ManagerOverview"],
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
      invalidatesTags: ["CrmOpportunities", "ManagerOverview"],
    }),
    convertCrmOpportunity: builder.mutation<
      { opportunityId: string; customer: Customer; message: string },
      string
    >({
      query: (id) => ({
        url: `/organisation/crm/opportunities/${id}/convert`,
        method: "POST",
      }),
      invalidatesTags: ["CrmOpportunities", "Customers", "ManagerOverview"],
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
      invalidatesTags: ["ScheduleShifts", "RosterOverview"],
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
      invalidatesTags: ["ScheduleShifts", "MyShifts", "RosterOverview"],
    }),
    cancelScheduleShift: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/shifts/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: [
        "ScheduleShifts",
        "MyShifts",
        "MatchCandidates",
        "RosterOverview",
      ],
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
      invalidatesTags: [
        "ScheduleShifts",
        "MyShifts",
        "MatchCandidates",
        "RosterOverview",
      ],
    }),
    broadcastScheduleShift: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/shifts/${id}/broadcast`,
        method: "POST",
      }),
      invalidatesTags: [
        "ScheduleShifts",
        "MyShifts",
        "MatchCandidates",
        "RosterOverview",
      ],
    }),
    withdrawShiftOffer: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/shifts/${id}/withdraw-offer`,
        method: "POST",
      }),
      invalidatesTags: [
        "ScheduleShifts",
        "MyShifts",
        "MatchCandidates",
        "RosterOverview",
      ],
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
      invalidatesTags: [
        "MyShifts",
        "ScheduleShifts",
        "MatchCandidates",
        "RosterOverview",
        "EmployeeOverview",
      ],
    }),
    declineShiftOffer: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/my/shifts/${id}/decline`,
        method: "POST",
      }),
      invalidatesTags: [
        "MyShifts",
        "ScheduleShifts",
        "MatchCandidates",
        "RosterOverview",
        "EmployeeOverview",
      ],
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
      invalidatesTags: [
        "MyAvailability",
        "MatchCandidates",
        "ScheduleWorkers",
        "EmployeeOverview",
      ],
    }),

    // Phase B — employee execution
    startMyShift: builder.mutation<ScheduleShift, string>({
      query: (id) => ({
        url: `/organisation/schedule/my/shifts/${id}/start`,
        method: "POST",
      }),
      invalidatesTags: [
        "MyShifts",
        "ScheduleShifts",
        "EmployeeOverview",
        "RosterOverview",
      ],
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
      invalidatesTags: [
        "MyShifts",
        "ScheduleShifts",
        "PendingApprovals",
        "OrgOverview",
        "EmployeeOverview",
        "RosterOverview",
      ],
    }),

    // Manager — variance approvals; Org Admin — task catalogues
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
        "ManagerOverview",
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
        "ManagerOverview",
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

    // ── Incidents ──
    listIncidents: builder.query<IncidentRecord[], ListIncidentsParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.status) search.set("status", params.status);
        if (params?.severity) search.set("severity", params.severity);
        if (params?.type) search.set("type", params.type);
        if (params?.q) search.set("q", params.q);
        if (params?.dateFrom) search.set("dateFrom", params.dateFrom);
        if (params?.dateTo) search.set("dateTo", params.dateTo);
        const qs = search.toString();
        return `/organisation/incidents${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Incidents" as const, id })),
              { type: "Incidents", id: "LIST" },
            ]
          : [{ type: "Incidents", id: "LIST" }],
    }),
    getIncident: builder.query<IncidentRecord, string>({
      query: (id) => `/organisation/incidents/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Incidents", id }],
    }),
    createIncident: builder.mutation<IncidentRecord, CreateIncidentRequest>({
      query: (body) => ({
        url: "/organisation/incidents",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Incidents", id: "LIST" }],
    }),
    updateIncident: builder.mutation<
      IncidentRecord,
      { id: string } & UpdateIncidentRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/organisation/incidents/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Incidents", id },
        { type: "Incidents", id: "LIST" },
      ],
    }),
    createIncidentAction: builder.mutation<
      IncidentActionItem,
      { incidentId: string } & CreateIncidentActionRequest
    >({
      query: ({ incidentId, ...body }) => ({
        url: `/organisation/incidents/${incidentId}/actions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { incidentId }) => [
        { type: "Incidents", id: incidentId },
        { type: "Incidents", id: "LIST" },
      ],
    }),
    updateIncidentAction: builder.mutation<
      IncidentActionItem,
      { incidentId: string; actionId: string } & UpdateIncidentActionRequest
    >({
      query: ({ incidentId, actionId, ...body }) => ({
        url: `/organisation/incidents/${incidentId}/actions/${actionId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { incidentId }) => [
        { type: "Incidents", id: incidentId },
        { type: "Incidents", id: "LIST" },
      ],
    }),
    uploadIncidentAttachment: builder.mutation<
      IncidentAttachmentMeta,
      { incidentId: string; file: File }
    >({
      query: ({ incidentId, file }) => {
        const form = new FormData();
        form.append("file", file);
        return {
          url: `/organisation/incidents/${incidentId}/attachments`,
          method: "POST",
          body: form,
        };
      },
      invalidatesTags: (_r, _e, { incidentId }) => [
        { type: "Incidents", id: incidentId },
        { type: "Incidents", id: "LIST" },
      ],
    }),

    // ── Organisation billing / manual payments ──
    getOrgBillingSummary: builder.query<OrgBillingSummary, void>({
      query: () => "/organisation/payments/summary",
      providesTags: ["Payments"],
    }),
    listOrgPayments: builder.query<OrganisationPayment[], void>({
      query: () => "/organisation/payments",
      providesTags: ["Payments"],
    }),
    submitOrgPayment: builder.mutation<
      OrganisationPayment,
      { paymentDate: string; reference: string; notes?: string; file: File }
    >({
      query: ({ paymentDate, reference, notes, file }) => {
        const body = new FormData();
        body.append("file", file);
        body.append("paymentDate", paymentDate);
        body.append("reference", reference);
        if (notes) body.append("notes", notes);
        return {
          url: "/organisation/payments",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Payments"],
    }),
  }),
});

export const {
  useGetMaintenanceStatusQuery,
  useSetupAccountMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useOrgLoginMutation,
  useOrgMeQuery,
  useGetOrganisationQuery,
  useGetOrgAdminOverviewQuery,
  useGetManagerOverviewQuery,
  useGetRosterOverviewQuery,
  useGetEmployeeOverviewQuery,
  useUpdateOrganisationMutation,
  useUploadOrganisationLogoMutation,
  useDeleteOrganisationLogoMutation,
  useListOrgModulesQuery,
  useSetOrgModuleEnabledMutation,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
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
  useListAdminOnboardingQuery,
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
  usePublishOfferShiftMutation,
  useBroadcastScheduleShiftMutation,
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
  useListIncidentsQuery,
  useGetIncidentQuery,
  useCreateIncidentMutation,
  useUpdateIncidentMutation,
  useCreateIncidentActionMutation,
  useUpdateIncidentActionMutation,
  useUploadIncidentAttachmentMutation,
  useGetOrgBillingSummaryQuery,
  useListOrgPaymentsQuery,
  useSubmitOrgPaymentMutation,
} = authApi;

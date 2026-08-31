export const CONFIGURABLE_ROLE_CODES = [
  "MANAGER",
  "ROSTERING_EXPERT",
  "EMPLOYEE",
] as const;

export type ConfigurableRoleCode = (typeof CONFIGURABLE_ROLE_CODES)[number];

export const CONFIGURABLE_ROLE_NAMES: Record<ConfigurableRoleCode, string> = {
  MANAGER: "Manager",
  ROSTERING_EXPERT: "Rostering Expert",
  EMPLOYEE: "Employee",
};

export type PermissionCatalogueEntry = {
  code: string;
  groupCode: string;
  label: string;
  description: string;
  sortOrder: number;
};

export const ORG_PERMISSION_CATALOGUE: PermissionCatalogueEntry[] = [
  {
    code: "view_org_settings",
    groupCode: "organisation",
    label: "View organisation settings",
    description: "Read organisation name, contact details, and branding.",
    sortOrder: 0,
  },
  {
    code: "edit_org_settings",
    groupCode: "organisation",
    label: "Edit organisation settings",
    description: "Update profile, branding, and organisation-level preferences.",
    sortOrder: 1,
  },
  {
    code: "view_module_config",
    groupCode: "organisation",
    label: "View module configuration",
    description: "See which modules are enabled within the org ceiling.",
    sortOrder: 2,
  },
  {
    code: "edit_module_config",
    groupCode: "organisation",
    label: "Edit module configuration",
    description: "Enable or disable modules for the organisation.",
    sortOrder: 3,
  },
  {
    code: "view_team",
    groupCode: "team",
    label: "View team members",
    description: "See the list of users and their roles in the organisation.",
    sortOrder: 4,
  },
  {
    code: "invite_team_members",
    groupCode: "team",
    label: "Invite team members",
    description: "Send invitations and assign roles to new users.",
    sortOrder: 5,
  },
  {
    code: "deactivate_team_members",
    groupCode: "team",
    label: "Deactivate team members",
    description: "Suspend or remove access for existing users.",
    sortOrder: 6,
  },
  {
    code: "view_assigned_participants",
    groupCode: "participants",
    label: "View assigned participants",
    description: "See participants linked to the user's own shifts.",
    sortOrder: 7,
  },
  {
    code: "view_all_participants",
    groupCode: "participants",
    label: "View all participant records",
    description: "Browse every participant in the organisation.",
    sortOrder: 8,
  },
  {
    code: "edit_participant_records",
    groupCode: "participants",
    label: "Edit participant records",
    description: "Update care plans, contacts, and participant details.",
    sortOrder: 9,
  },
  {
    code: "create_participants",
    groupCode: "participants",
    label: "Create participants",
    description: "Onboard new participants into the organisation.",
    sortOrder: 10,
  },
  {
    code: "view_workforce_compliance",
    groupCode: "workforce",
    label: "View workforce compliance",
    description: "See certifications, expiries, and policy status.",
    sortOrder: 11,
  },
  {
    code: "edit_workforce_records",
    groupCode: "workforce",
    label: "Edit workforce records",
    description: "Update worker profiles and compliance documentation.",
    sortOrder: 12,
  },
  {
    code: "onboard_workers",
    groupCode: "workforce",
    label: "Onboard new workers",
    description: "Start onboarding workflows for support workers.",
    sortOrder: 13,
  },
  {
    code: "view_schedules",
    groupCode: "rostering",
    label: "View schedules",
    description: "See published and draft rosters.",
    sortOrder: 14,
  },
  {
    code: "create_edit_schedules",
    groupCode: "rostering",
    label: "Create & edit schedules",
    description: "Build rosters and adjust shift timings.",
    sortOrder: 15,
  },
  {
    code: "assign_shifts",
    groupCode: "rostering",
    label: "Assign shifts",
    description: "Match workers to shifts and publish assignments.",
    sortOrder: 16,
  },
  {
    code: "approve_shift_changes",
    groupCode: "rostering",
    label: "Approve shift changes",
    description: "Review and approve swap or cancellation requests.",
    sortOrder: 17,
  },
  {
    code: "view_own_timesheets",
    groupCode: "time",
    label: "View own timesheets",
    description: "See hours logged for the signed-in user.",
    sortOrder: 18,
  },
  {
    code: "view_all_timesheets",
    groupCode: "time",
    label: "View all timesheets",
    description: "Browse timesheets across the whole workforce.",
    sortOrder: 19,
  },
  {
    code: "approve_timesheets",
    groupCode: "time",
    label: "Approve timesheets",
    description: "Sign off hours before finance handoff.",
    sortOrder: 20,
  },
  {
    code: "view_progress_notes",
    groupCode: "care",
    label: "View progress notes",
    description: "Read notes recorded for participants.",
    sortOrder: 21,
  },
  {
    code: "create_progress_notes",
    groupCode: "care",
    label: "Create progress notes",
    description: "Write shift notes and voice-to-text entries.",
    sortOrder: 22,
  },
  {
    code: "view_incidents",
    groupCode: "care",
    label: "View incident reports",
    description: "Access logged incidents and follow-up status.",
    sortOrder: 23,
  },
  {
    code: "report_incidents",
    groupCode: "care",
    label: "Report incidents",
    description: "Submit new incident reports from the field.",
    sortOrder: 24,
  },
  {
    code: "view_documents",
    groupCode: "documents",
    label: "View documents",
    description: "Open organisation and participant document libraries.",
    sortOrder: 25,
  },
  {
    code: "manage_documents",
    groupCode: "documents",
    label: "Manage documents",
    description: "Upload, version, and archive documents and forms.",
    sortOrder: 26,
  },
  {
    code: "view_reports",
    groupCode: "reporting",
    label: "View reports & analytics",
    description: "Open dashboards and operational reports.",
    sortOrder: 27,
  },
  {
    code: "export_data",
    groupCode: "reporting",
    label: "Export data",
    description: "Download CSV or PDF extracts for external use.",
    sortOrder: 28,
  },
  {
    code: "view_finance_handoff",
    groupCode: "finance",
    label: "View finance handoff",
    description: "See approved hours and billing line items.",
    sortOrder: 29,
  },
  {
    code: "submit_finance_data",
    groupCode: "finance",
    label: "Submit finance data",
    description: "Push approved records to finance workflows.",
    sortOrder: 30,
  },
];

export const ORG_PERMISSION_CODES = ORG_PERMISSION_CATALOGUE.map((p) => p.code);

type CapabilityMap = Record<string, boolean>;

export const DEFAULT_ROLE_CAPABILITIES: Record<ConfigurableRoleCode, CapabilityMap> = {
  MANAGER: {
    view_org_settings: true,
    view_module_config: true,
    view_team: true,
    invite_team_members: true,
    view_assigned_participants: true,
    view_all_participants: true,
    edit_participant_records: true,
    view_workforce_compliance: true,
    edit_workforce_records: true,
    onboard_workers: true,
    view_schedules: true,
    create_edit_schedules: true,
    assign_shifts: true,
    approve_shift_changes: true,
    view_own_timesheets: true,
    view_all_timesheets: true,
    approve_timesheets: true,
    view_progress_notes: true,
    create_progress_notes: true,
    view_incidents: true,
    report_incidents: true,
    view_documents: true,
    manage_documents: true,
    view_reports: true,
    export_data: true,
    view_finance_handoff: true,
  },
  ROSTERING_EXPERT: {
    view_org_settings: true,
    view_team: true,
    view_assigned_participants: true,
    view_all_participants: true,
    view_workforce_compliance: true,
    view_schedules: true,
    create_edit_schedules: true,
    assign_shifts: true,
    approve_shift_changes: true,
    view_own_timesheets: true,
    view_progress_notes: true,
    view_documents: true,
    view_reports: true,
  },
  EMPLOYEE: {
    view_assigned_participants: true,
    view_schedules: true,
    view_own_timesheets: true,
    create_progress_notes: true,
    report_incidents: true,
    view_documents: true,
  },
};

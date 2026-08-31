export const CONFIGURABLE_ROLES = [
  {
    id: "MANAGER" as const,
    label: "Manager",
    description: "Oversees workforce, compliance, and day-to-day operations.",
    accent: "var(--primary)",
    tint: "bg-primary/10 text-primary",
  },
  {
    id: "ROSTERING_EXPERT" as const,
    label: "Rostering Expert",
    description: "Builds schedules and matches workers to participant shifts.",
    accent: "var(--accent)",
    tint: "bg-accent/10 text-accent",
  },
  {
    id: "EMPLOYEE" as const,
    label: "Employee",
    description: "Support workers executing shifts, notes, and timesheets.",
    accent: "#0f766e",
    tint: "bg-emerald-100 text-emerald-800",
  },
];

export type ConfigurableRoleId = (typeof CONFIGURABLE_ROLES)[number]["id"];

export type PermissionId =
  | "view_org_settings"
  | "edit_org_settings"
  | "view_module_config"
  | "edit_module_config"
  | "view_team"
  | "invite_team_members"
  | "deactivate_team_members"
  | "view_assigned_participants"
  | "view_all_participants"
  | "edit_participant_records"
  | "create_participants"
  | "view_workforce_compliance"
  | "edit_workforce_records"
  | "onboard_workers"
  | "view_schedules"
  | "create_edit_schedules"
  | "assign_shifts"
  | "approve_shift_changes"
  | "view_own_timesheets"
  | "view_all_timesheets"
  | "approve_timesheets"
  | "view_progress_notes"
  | "create_progress_notes"
  | "view_incidents"
  | "report_incidents"
  | "view_documents"
  | "manage_documents"
  | "view_reports"
  | "export_data"
  | "view_finance_handoff"
  | "submit_finance_data";

export type PermissionGroup = {
  id: string;
  label: string;
  description: string;
  permissions: {
    id: PermissionId;
    label: string;
    description: string;
  }[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "organisation",
    label: "Organisation & configuration",
    description: "Who can see or change org profile, branding, and module setup.",
    permissions: [
      {
        id: "view_org_settings",
        label: "View organisation settings",
        description: "Read organisation name, contact details, and branding.",
      },
      {
        id: "edit_org_settings",
        label: "Edit organisation settings",
        description: "Update profile, branding, and organisation-level preferences.",
      },
      {
        id: "view_module_config",
        label: "View module configuration",
        description: "See which modules are enabled within the org ceiling.",
      },
      {
        id: "edit_module_config",
        label: "Edit module configuration",
        description: "Enable or disable modules for the organisation.",
      },
    ],
  },
  {
    id: "team",
    label: "Team management",
    description: "Control visibility and lifecycle of staff accounts.",
    permissions: [
      {
        id: "view_team",
        label: "View team members",
        description: "See the list of users and their roles in the organisation.",
      },
      {
        id: "invite_team_members",
        label: "Invite team members",
        description: "Send invitations and assign roles to new users.",
      },
      {
        id: "deactivate_team_members",
        label: "Deactivate team members",
        description: "Suspend or remove access for existing users.",
      },
    ],
  },
  {
    id: "participants",
    label: "Participants",
    description: "Access to participant records and care profiles.",
    permissions: [
      {
        id: "view_assigned_participants",
        label: "View assigned participants",
        description: "See participants linked to the user’s own shifts.",
      },
      {
        id: "view_all_participants",
        label: "View all participant records",
        description: "Browse every participant in the organisation.",
      },
      {
        id: "edit_participant_records",
        label: "Edit participant records",
        description: "Update care plans, contacts, and participant details.",
      },
      {
        id: "create_participants",
        label: "Create participants",
        description: "Onboard new participants into the organisation.",
      },
    ],
  },
  {
    id: "workforce",
    label: "Workforce & compliance",
    description: "Onboarding, certifications, and compliance tracking.",
    permissions: [
      {
        id: "view_workforce_compliance",
        label: "View workforce compliance",
        description: "See certifications, expiries, and policy status.",
      },
      {
        id: "edit_workforce_records",
        label: "Edit workforce records",
        description: "Update worker profiles and compliance documentation.",
      },
      {
        id: "onboard_workers",
        label: "Onboard new workers",
        description: "Start onboarding workflows for support workers.",
      },
    ],
  },
  {
    id: "rostering",
    label: "Rostering & shifts",
    description: "Schedules, assignments, and shift change approvals.",
    permissions: [
      {
        id: "view_schedules",
        label: "View schedules",
        description: "See published and draft rosters.",
      },
      {
        id: "create_edit_schedules",
        label: "Create & edit schedules",
        description: "Build rosters and adjust shift timings.",
      },
      {
        id: "assign_shifts",
        label: "Assign shifts",
        description: "Match workers to shifts and publish assignments.",
      },
      {
        id: "approve_shift_changes",
        label: "Approve shift changes",
        description: "Review and approve swap or cancellation requests.",
      },
    ],
  },
  {
    id: "time",
    label: "Time & attendance",
    description: "Timesheets, approvals, and payroll-ready hours.",
    permissions: [
      {
        id: "view_own_timesheets",
        label: "View own timesheets",
        description: "See hours logged for the signed-in user.",
      },
      {
        id: "view_all_timesheets",
        label: "View all timesheets",
        description: "Browse timesheets across the whole workforce.",
      },
      {
        id: "approve_timesheets",
        label: "Approve timesheets",
        description: "Sign off hours before finance handoff.",
      },
    ],
  },
  {
    id: "care",
    label: "Care documentation",
    description: "Progress notes, incidents, and clinical record-keeping.",
    permissions: [
      {
        id: "view_progress_notes",
        label: "View progress notes",
        description: "Read notes recorded for participants.",
      },
      {
        id: "create_progress_notes",
        label: "Create progress notes",
        description: "Write shift notes and voice-to-text entries.",
      },
      {
        id: "view_incidents",
        label: "View incident reports",
        description: "Access logged incidents and follow-up status.",
      },
      {
        id: "report_incidents",
        label: "Report incidents",
        description: "Submit new incident reports from the field.",
      },
    ],
  },
  {
    id: "documents",
    label: "Documents & forms",
    description: "Policies, forms, and uploaded participant files.",
    permissions: [
      {
        id: "view_documents",
        label: "View documents",
        description: "Open organisation and participant document libraries.",
      },
      {
        id: "manage_documents",
        label: "Manage documents",
        description: "Upload, version, and archive documents and forms.",
      },
    ],
  },
  {
    id: "reporting",
    label: "Reporting & exports",
    description: "Analytics dashboards and data exports.",
    permissions: [
      {
        id: "view_reports",
        label: "View reports & analytics",
        description: "Open dashboards and operational reports.",
      },
      {
        id: "export_data",
        label: "Export data",
        description: "Download CSV or PDF extracts for external use.",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance handoff",
    description: "Billing-ready data and payroll integration points.",
    permissions: [
      {
        id: "view_finance_handoff",
        label: "View finance handoff",
        description: "See approved hours and billing line items.",
      },
      {
        id: "submit_finance_data",
        label: "Submit finance data",
        description: "Push approved records to finance workflows.",
      },
    ],
  },
];

export type RolePermissionMatrix = Record<ConfigurableRoleId, Record<PermissionId, boolean>>;

function buildPermissionDefaults(
  overrides: Partial<Record<ConfigurableRoleId, Partial<Record<PermissionId, boolean>>>>,
): RolePermissionMatrix {
  const allIds = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((p) => p.id));
  const base = Object.fromEntries(
    CONFIGURABLE_ROLES.map((role) => [
      role.id,
      Object.fromEntries(allIds.map((id) => [id, false])) as Record<PermissionId, boolean>,
    ]),
  ) as RolePermissionMatrix;

  for (const role of CONFIGURABLE_ROLES) {
    const roleOverrides = overrides[role.id];
    if (roleOverrides) {
      for (const [key, value] of Object.entries(roleOverrides)) {
        base[role.id][key as PermissionId] = value;
      }
    }
  }

  return base;
}

export const DEFAULT_PERMISSION_MATRIX: RolePermissionMatrix = buildPermissionDefaults({
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
});

export function countGrantedPermissions(matrix: RolePermissionMatrix, roleId: ConfigurableRoleId) {
  return Object.values(matrix[roleId]).filter(Boolean).length;
}

/**
 * Org-scoped role permission catalog.
 * Page access and action permissions are independent axes.
 * Only MANAGER / ROSTERING_EXPERT / EMPLOYEE are configurable.
 * ORG_ADMIN always has full access (not stored in the matrix).
 */

export const CONFIGURABLE_ROLES = [
  "MANAGER",
  "ROSTERING_EXPERT",
  "EMPLOYEE",
] as const;

export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number];

export const PAGE_PERMISSIONS = [
  "CRM",
  "CUSTOMERS",
  "WORKFORCE",
  "SCHEDULE",
  "INCIDENTS",
  "FORMS_DOCUMENTS",
  "FINANCE",
  "INSIGHTS",
] as const;

export type PagePermission = (typeof PAGE_PERMISSIONS)[number];

export const ACTION_PERMISSIONS = [
  "REGISTER_TEAM_MEMBERS",
  "MANAGE_SHIFTS",
  "PUBLISH_ASSIGN_SHIFTS",
  "MANAGE_CUSTOMERS",
  "APPROVE_ONBOARDING",
  "APPROVE_TIMESHEETS_SERVICE_DELIVERY",
  "MANAGE_INCIDENTS",
  "MANAGE_DOCUMENTS_FORMS",
  "VIEW_EXPORT_REPORTS",
  /** Personal worker tools — scoped to the signed-in user only. */
  "VIEW_MY_SHIFTS",
  "MANAGE_MY_AVAILABILITY",
  "EXECUTE_MY_SHIFTS",
  "VIEW_MY_TIMESHEETS",
  /** May appear in Matching / be assigned or offered shifts. */
  "ASSIGNABLE_AS_WORKER",
] as const;

export type ActionPermission = (typeof ACTION_PERMISSIONS)[number];

/** Worker self-service actions (Org Admin is not a field worker). */
export const PERSONAL_WORKER_ACTIONS = [
  "VIEW_MY_SHIFTS",
  "MANAGE_MY_AVAILABILITY",
  "EXECUTE_MY_SHIFTS",
  "VIEW_MY_TIMESHEETS",
  "ASSIGNABLE_AS_WORKER",
] as const satisfies readonly ActionPermission[];

export function isPersonalWorkerAction(
  action: string,
): action is (typeof PERSONAL_WORKER_ACTIONS)[number] {
  return (PERSONAL_WORKER_ACTIONS as readonly string[]).includes(action);
}

export type PagePermissionMap = Record<PagePermission, boolean>;
export type ActionPermissionMap = Record<ActionPermission, boolean>;

export type RolePermissions = {
  pages: PagePermissionMap;
  actions: ActionPermissionMap;
};

export type RolePermissionMatrix = Record<ConfigurableRole, RolePermissions>;

/** Plan/org module code that must be enabled for a page to be usable. */
export const PAGE_MODULE: Partial<Record<PagePermission, string>> = {
  CRM: "CRM",
  CUSTOMERS: "CUSTOMERS",
  WORKFORCE: "WORKFORCE",
  SCHEDULE: "SCHEDULE",
  INCIDENTS: "INCIDENTS",
  FINANCE: "FINANCE",
  INSIGHTS: "DASHBOARD",
};

export const PAGE_LABELS: Record<PagePermission, string> = {
  CRM: "CRM",
  CUSTOMERS: "Customers / Participants",
  WORKFORCE: "Workforce",
  SCHEDULE: "Schedule / Rostering",
  INCIDENTS: "Incidents",
  FORMS_DOCUMENTS: "Forms & Documents",
  FINANCE: "Finance",
  INSIGHTS: "Insights",
};

export const ACTION_LABELS: Record<ActionPermission, string> = {
  REGISTER_TEAM_MEMBERS: "Register / Create Team Members",
  MANAGE_SHIFTS: "Manage Shifts",
  PUBLISH_ASSIGN_SHIFTS: "Publish / Assign Shifts",
  MANAGE_CUSTOMERS: "Manage Customers / Participants",
  APPROVE_ONBOARDING: "Approve Onboarding",
  APPROVE_TIMESHEETS_SERVICE_DELIVERY: "Approve Timesheets / Service Delivery",
  MANAGE_INCIDENTS: "Manage Incidents",
  MANAGE_DOCUMENTS_FORMS: "Manage Documents & Forms",
  VIEW_EXPORT_REPORTS: "View / Export Reports",
  VIEW_MY_SHIFTS: "View My Shifts",
  MANAGE_MY_AVAILABILITY: "Manage My Availability",
  EXECUTE_MY_SHIFTS: "Execute My Shifts",
  VIEW_MY_TIMESHEETS: "View My Timesheets",
  ASSIGNABLE_AS_WORKER: "Assignable as Worker",
};

export const CONFIGURABLE_ROLE_META: Record<
  ConfigurableRole,
  { label: string; description: string }
> = {
  MANAGER: {
    label: "Manager",
    description: "Oversees workforce, customers, and day-to-day operations.",
  },
  ROSTERING_EXPERT: {
    label: "Rostering Expert",
    description: "Builds schedules and matches workers to participant shifts.",
  },
  EMPLOYEE: {
    label: "Employee",
    description: "Support workers executing shifts, notes, and timesheets.",
  },
};

function allFalsePages(): PagePermissionMap {
  return Object.fromEntries(PAGE_PERMISSIONS.map((id) => [id, false])) as PagePermissionMap;
}

function allFalseActions(): ActionPermissionMap {
  return Object.fromEntries(
    ACTION_PERMISSIONS.map((id) => [id, false]),
  ) as ActionPermissionMap;
}

function allTruePages(): PagePermissionMap {
  return Object.fromEntries(PAGE_PERMISSIONS.map((id) => [id, true])) as PagePermissionMap;
}

function allTrueActions(): ActionPermissionMap {
  return Object.fromEntries(
    ACTION_PERMISSIONS.map((id) => [id, true]),
  ) as ActionPermissionMap;
}

/** Full access used for ORG_ADMIN responses (not stored). */
export function fullPermissions(): RolePermissions {
  return { pages: allTruePages(), actions: allTrueActions() };
}

/**
 * Defaults mirror today’s hardcoded role behaviour so existing orgs
 * keep the same capabilities until an Org Admin changes the matrix.
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrix = {
  MANAGER: {
    pages: {
      ...allFalsePages(),
      CRM: true,
      CUSTOMERS: true,
      WORKFORCE: true,
      INCIDENTS: true,
      FORMS_DOCUMENTS: true,
      INSIGHTS: true,
    },
    actions: {
      ...allFalseActions(),
      MANAGE_CUSTOMERS: true,
      MANAGE_INCIDENTS: true,
      MANAGE_DOCUMENTS_FORMS: true,
      APPROVE_TIMESHEETS_SERVICE_DELIVERY: true,
      APPROVE_ONBOARDING: true,
      VIEW_EXPORT_REPORTS: true,
    },
  },
  ROSTERING_EXPERT: {
    pages: {
      ...allFalsePages(),
      CUSTOMERS: true,
      SCHEDULE: true,
      INSIGHTS: true,
    },
    actions: {
      ...allFalseActions(),
      MANAGE_SHIFTS: true,
      PUBLISH_ASSIGN_SHIFTS: true,
      VIEW_EXPORT_REPORTS: true,
    },
  },
  EMPLOYEE: {
    pages: {
      ...allFalsePages(),
      CUSTOMERS: true,
      FINANCE: true,
      INSIGHTS: true,
    },
    actions: {
      ...allFalseActions(),
      VIEW_MY_SHIFTS: true,
      MANAGE_MY_AVAILABILITY: true,
      EXECUTE_MY_SHIFTS: true,
      VIEW_MY_TIMESHEETS: true,
      ASSIGNABLE_AS_WORKER: true,
    },
  },
};

export function isConfigurableRole(role: string): role is ConfigurableRole {
  return (CONFIGURABLE_ROLES as readonly string[]).includes(role);
}

export function isPagePermission(value: string): value is PagePermission {
  return (PAGE_PERMISSIONS as readonly string[]).includes(value);
}

export function isActionPermission(value: string): value is ActionPermission {
  return (ACTION_PERMISSIONS as readonly string[]).includes(value);
}

export function emptyRolePermissions(): RolePermissions {
  return { pages: allFalsePages(), actions: allFalseActions() };
}

/** Merge stored JSON with catalog defaults (unknown keys ignored; missing keys default). */
export function mergeRolePermissions(
  role: ConfigurableRole,
  stored?: { pages?: unknown; actions?: unknown } | null,
): RolePermissions {
  const defaults = DEFAULT_ROLE_PERMISSIONS[role];
  const pages = { ...defaults.pages };
  const actions = { ...defaults.actions };

  if (stored?.pages && typeof stored.pages === "object" && !Array.isArray(stored.pages)) {
    for (const [key, value] of Object.entries(stored.pages as Record<string, unknown>)) {
      if (isPagePermission(key) && typeof value === "boolean") {
        pages[key] = value;
      }
    }
  }

  if (
    stored?.actions &&
    typeof stored.actions === "object" &&
    !Array.isArray(stored.actions)
  ) {
    for (const [key, value] of Object.entries(
      stored.actions as Record<string, unknown>,
    )) {
      if (isActionPermission(key) && typeof value === "boolean") {
        actions[key] = value;
      }
    }
  }

  // Onboarding approval is Manager (and Org Admin) only.
  if (role !== "MANAGER") {
    actions.APPROVE_ONBOARDING = false;
  }

  return { pages, actions };
}

export function buildDefaultMatrix(): RolePermissionMatrix {
  return {
    MANAGER: mergeRolePermissions("MANAGER"),
    ROSTERING_EXPERT: mergeRolePermissions("ROSTERING_EXPERT"),
    EMPLOYEE: mergeRolePermissions("EMPLOYEE"),
  };
}

export function sanitizeRolePermissionsInput(
  role: ConfigurableRole,
  input: { pages?: Partial<Record<string, boolean>>; actions?: Partial<Record<string, boolean>> },
): RolePermissions {
  const pages = allFalsePages();
  const actions = allFalseActions();

  for (const id of PAGE_PERMISSIONS) {
    if (typeof input.pages?.[id] === "boolean") {
      pages[id] = input.pages[id]!;
    } else {
      pages[id] = DEFAULT_ROLE_PERMISSIONS[role].pages[id];
    }
  }

  for (const id of ACTION_PERMISSIONS) {
    if (typeof input.actions?.[id] === "boolean") {
      actions[id] = input.actions[id]!;
    } else {
      actions[id] = DEFAULT_ROLE_PERMISSIONS[role].actions[id];
    }
  }

  // Onboarding approval is Manager (and Org Admin) only — never Rostering/Employee.
  if (role !== "MANAGER") {
    actions.APPROVE_ONBOARDING = false;
  }

  return { pages, actions };
}

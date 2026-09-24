import type { ConfigurableRole } from './permissions.service';

/**
 * Default permissions per role, used when the Org Admin has not saved an
 * override (no RolePermission row). Mirrors the client template in
 * apps/client/lib/dashboard/content/org-admin-roles.ts, plus
 * create_participants for MANAGER and view_team for EMPLOYEE so that
 * access which already works today is not removed.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<ConfigurableRole, readonly string[]> = {
  MANAGER: [
    'view_org_settings', 'view_module_config',
    'view_team', 'invite_team_members',
    'view_assigned_participants', 'view_all_participants',
    'edit_participant_records', 'create_participants',
    'view_workforce_compliance', 'edit_workforce_records', 'onboard_workers',
    'view_schedules', 'create_edit_schedules', 'assign_shifts', 'approve_shift_changes',
    'view_own_timesheets', 'view_all_timesheets', 'approve_timesheets',
    'view_progress_notes', 'create_progress_notes', 'view_incidents', 'report_incidents',
    'view_documents', 'manage_documents',
    'view_reports', 'export_data',
    'view_finance_handoff',
  ],
  ROSTERING_EXPERT: [
    'view_org_settings', 'view_team',
    'view_assigned_participants', 'view_all_participants',
    'view_workforce_compliance',
    'view_schedules', 'create_edit_schedules', 'assign_shifts', 'approve_shift_changes',
    'view_own_timesheets', 'view_progress_notes',
    'view_documents', 'view_reports',
  ],
  EMPLOYEE: [
    'view_team',
    'view_assigned_participants', 'view_schedules', 'view_own_timesheets',
    'create_progress_notes', 'report_incidents', 'view_documents',
  ],
};

export function isDefaultEnabled(role: ConfigurableRole, permissionCode: string): boolean {
  return ROLE_DEFAULT_PERMISSIONS[role].includes(permissionCode);
}

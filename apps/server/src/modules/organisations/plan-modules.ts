import { OrgPlan } from 'database';

/**
 * Maps each plan to the module codes it entitles.
 * This is the single source of truth for plan → module entitlement.
 */
const BASIC_MODULES = [
  'HOME',
  'CRM',
  'CUSTOMERS',
  'WORKFORCE',
  'SCHEDULE',
] as const;

const ADVANCED_MODULES = [
  'HOME',
  'CRM',
  'CUSTOMERS',
  'WORKFORCE',
  'SCHEDULE',
  'SERVICE_DELIVERY',
  'INCIDENTS',
  'FINANCE',
  'INSIGHTS',
] as const;

export const PLAN_MODULES: Record<OrgPlan, readonly string[]> = {
  BASIC: BASIC_MODULES,
  ADVANCED: ADVANCED_MODULES,
};

/** Returns the module codes entitled by the given plan. */
export function getEntitledModuleCodes(plan: OrgPlan): readonly string[] {
  return PLAN_MODULES[plan];
}

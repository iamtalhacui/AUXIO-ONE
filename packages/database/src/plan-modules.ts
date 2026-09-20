import type { OrgPlan } from "@prisma/client";

/**
 * Plan → module entitlement. Single source of truth shared by the API and the seed.
 *
 * SCHEDULE covers rostering (create, match, publish, offer/accept).
 * SERVICE_DELIVERY covers execution (start, tasks, notes, finish, variance approval).
 * FINANCE covers the timesheet / billing-ready handoff.
 * DASHBOARD covers the per-role home overview pages.
 */

/** Entitled by every plan, always on, never disableable. */
export const CORE_MODULES = [
  "WORKFORCE",
  "CUSTOMERS",
  "SCHEDULE",
  "SERVICE_DELIVERY",
] as const;

/** Granted in full on ADVANCED, a per-organisation choice on CUSTOM. */
export const OPTIONAL_MODULES = [
  "DASHBOARD",
  "CRM",
  "FINANCE",
  "INCIDENTS",
] as const;

export function isCoreModule(code: string): boolean {
  return (CORE_MODULES as readonly string[]).includes(code);
}

export function isOptionalModule(code: string): boolean {
  return (OPTIONAL_MODULES as readonly string[]).includes(code);
}

/**
 * The portion of each plan's entitlement that is fixed in code.
 *
 * CUSTOM maps to the core set alone because its add-ons are per-organisation
 * data; use resolveEntitledModuleCodes() whenever an organisation is in hand.
 */
export const PLAN_MODULES: Record<OrgPlan, readonly string[]> = {
  BASIC: CORE_MODULES,
  ADVANCED: [...CORE_MODULES, ...OPTIONAL_MODULES],
  CUSTOM: CORE_MODULES,
};

/** Returns the guaranteed module codes for a plan, ignoring CUSTOM add-ons. */
export function getEntitledModuleCodes(plan: OrgPlan): readonly string[] {
  return PLAN_MODULES[plan];
}

/**
 * Full entitlement for one organisation. On CUSTOM the granted add-ons are
 * unioned onto the core set, so the core four survive even if the stored rows
 * are incomplete.
 */
export function resolveEntitledModuleCodes(
  plan: OrgPlan,
  grantedCodes: readonly string[],
): string[] {
  if (plan !== "CUSTOM") return [...PLAN_MODULES[plan]];

  const addOns = grantedCodes.filter(isOptionalModule);
  return [...new Set([...CORE_MODULES, ...addOns])];
}

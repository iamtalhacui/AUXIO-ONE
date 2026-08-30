export enum ModuleCeilingTemplate {
  BASIC = 'BASIC',
  ADVANCED = 'ADVANCED',
  CUSTOM = 'CUSTOM',
}

/** Core operational modules for small providers. */
export const BASIC_MODULE_CODES = ['03', '05', '06', '07', '10'] as const;

/** Broader package including rostering, notes, incidents, and finance handoff. */
export const ADVANCED_MODULE_CODES = [
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '12',
] as const;

/** Modules a Super Admin may pick in the custom template (excludes platform-only). */
export const ASSIGNABLE_MODULE_CODES = [
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '17',
] as const;

export function resolveModuleCeilingCodes(
  template: ModuleCeilingTemplate,
  customCodes?: string[],
): string[] {
  switch (template) {
    case ModuleCeilingTemplate.BASIC:
      return [...BASIC_MODULE_CODES];
    case ModuleCeilingTemplate.ADVANCED:
      return [...ADVANCED_MODULE_CODES];
    case ModuleCeilingTemplate.CUSTOM:
      return customCodes ?? [];
    default:
      return [];
  }
}

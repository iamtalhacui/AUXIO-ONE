import type {
  OnboardingFieldDef,
  OnboardingPayload,
  RoleOnboardingTemplate,
} from './onboarding-templates';

export type OnboardingValidationIssue = {
  section: 'personal' | 'work' | 'documents';
  field: string;
  message: string;
};

export type OnboardingValidationResult = {
  valid: boolean;
  issues: OnboardingValidationIssue[];
};

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  return false;
}

function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateFields(
  section: 'personal' | 'work',
  fields: OnboardingFieldDef[],
  values: Record<string, unknown> | undefined,
  issues: OnboardingValidationIssue[],
) {
  const data = values ?? {};

  for (const field of fields) {
    const value = data[field.key];

    if (field.required && !isFilled(value)) {
      issues.push({
        section,
        field: field.key,
        message: `${field.label} is required`,
      });
      continue;
    }

    if (!isFilled(value)) continue;

    if (field.type === 'chips') {
      if (!Array.isArray(value)) {
        issues.push({
          section,
          field: field.key,
          message: `${field.label} must be a list`,
        });
        continue;
      }
      const allowed = new Set((field.options ?? []).map((option) => option.value));
      for (const item of value) {
        if (typeof item !== 'string' || (allowed.size > 0 && !allowed.has(item))) {
          issues.push({
            section,
            field: field.key,
            message: `${field.label} contains an invalid option`,
          });
          break;
        }
      }
      continue;
    }

    if (field.type === 'date' && !isValidDateString(value)) {
      issues.push({
        section,
        field: field.key,
        message: `${field.label} must be a valid date`,
      });
      continue;
    }

    if (field.type === 'email' && !isValidEmail(value)) {
      issues.push({
        section,
        field: field.key,
        message: `${field.label} must be a valid email`,
      });
    }
  }
}

export type ValidateOnboardingOptions = {
  /** When true, required document fieldKeys must appear in uploadedFieldKeys. */
  checkDocuments?: boolean;
  uploadedFieldKeys?: string[];
};

/**
 * Validates a flexible JSON payload against the role template.
 * Unknown extra keys are allowed (kept flexible for MVP).
 */
export function validateOnboardingPayload(
  template: RoleOnboardingTemplate,
  payload: OnboardingPayload,
  options: ValidateOnboardingOptions = {},
): OnboardingValidationResult {
  const issues: OnboardingValidationIssue[] = [];

  validateFields('personal', template.personalFields, payload.personal, issues);
  validateFields('work', template.workFields, payload.work, issues);

  if (options.checkDocuments) {
    const uploaded = new Set(options.uploadedFieldKeys ?? []);
    for (const need of template.documentNeeds) {
      if (need.required && !uploaded.has(need.key)) {
        issues.push({
          section: 'documents',
          field: need.key,
          message: `${need.title} is required`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

export type WorkforceOnboardingRole = 'EMPLOYEE' | 'MANAGER' | 'ROSTERING_EXPERT';

export type OnboardingFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'textarea'
  | 'select'
  | 'chips';

export type OnboardingFieldDef = {
  key: string;
  label: string;
  required?: boolean;
  type?: OnboardingFieldType;
  options?: { value: string; label: string }[];
  readOnly?: boolean;
};

export type OnboardingDocumentNeed = {
  key: string;
  title: string;
  description: string;
  required: boolean;
};

export type RoleOnboardingTemplate = {
  role: WorkforceOnboardingRole;
  roleLabel: string;
  steps: Array<{ id: string; label: string }>;
  personalHint: string;
  workHint: string;
  personalFields: OnboardingFieldDef[];
  workFields: OnboardingFieldDef[];
  documentNeeds: OnboardingDocumentNeed[];
};

export type OnboardingPayload = {
  personal?: Record<string, unknown>;
  work?: Record<string, unknown>;
};

const STEPS = [
  { id: 'personal', label: 'Personal information' },
  { id: 'work', label: 'Work details' },
  { id: 'documents', label: 'Documents' },
  { id: 'review', label: 'Review' },
  { id: 'submit', label: 'Submit' },
];

const SERVICE_LINE_OPTIONS = [
  { value: 'NDIS', label: 'NDIS' },
  { value: 'AGED_CARE', label: 'Aged Care' },
  { value: 'FIELD_SERVICES', label: 'Field Services' },
];

const SHARED_PERSONAL_FIELDS: OnboardingFieldDef[] = [
  { key: 'firstName', label: 'First name', required: true, readOnly: true },
  { key: 'lastName', label: 'Last name', required: true, readOnly: true },
  { key: 'preferredName', label: 'Preferred name' },
  { key: 'dateOfBirth', label: 'Date of birth', required: true, type: 'date' },
  { key: 'email', label: 'Email address', required: true, type: 'email', readOnly: true },
  { key: 'mobile', label: 'Mobile number', required: true, type: 'tel' },
  { key: 'homeAddress', label: 'Home address', required: true },
  { key: 'emergencyName', label: 'Emergency contact name', required: true },
  { key: 'emergencyPhone', label: 'Emergency contact phone', required: true, type: 'tel' },
];

const EMPLOYEE_TEMPLATE: RoleOnboardingTemplate = {
  role: 'EMPLOYEE',
  roleLabel: 'Employee',
  steps: STEPS,
  personalHint: 'Use your legal name as it appears on your identity documents.',
  workHint: 'Tell us how you can support participants and when you are available.',
  personalFields: SHARED_PERSONAL_FIELDS,
  workFields: [
    {
      key: 'serviceLines',
      label: 'Service lines',
      required: true,
      type: 'chips',
      options: SERVICE_LINE_OPTIONS,
    },
    { key: 'preferredHours', label: 'Preferred hours', required: true },
    { key: 'startDatePreference', label: 'Preferred start date', type: 'date' },
    {
      key: 'availabilityNotes',
      label: 'Availability notes',
      required: true,
      type: 'textarea',
    },
    { key: 'wwccNumber', label: 'WWCC number', required: true },
    { key: 'wwccExpiry', label: 'WWCC expiry', required: true, type: 'date' },
    { key: 'policeCheckDate', label: 'Police check date', type: 'date' },
    { key: 'firstAidExpiry', label: 'First aid expiry', type: 'date' },
  ],
  documentNeeds: [
    { key: 'photoId', title: 'Photo ID', description: 'Driver licence or passport', required: true },
    { key: 'qualifications', title: 'Qualifications', description: 'PDF, JPG or PNG', required: true },
    { key: 'wwcc', title: 'WWCC', description: 'Working with Children Check', required: true },
    {
      key: 'policeCheck',
      title: 'Police check',
      description: 'National police certificate',
      required: true,
    },
    {
      key: 'firstAid',
      title: 'First aid',
      description: 'Optional if current',
      required: false,
    },
  ],
};

const MANAGER_TEMPLATE: RoleOnboardingTemplate = {
  role: 'MANAGER',
  roleLabel: 'Manager',
  steps: STEPS,
  personalHint: 'Use your legal name as it appears on your identity documents.',
  workHint: 'Share your management role details so we can set up your workspace correctly.',
  personalFields: SHARED_PERSONAL_FIELDS,
  workFields: [
    { key: 'jobTitle', label: 'Job title', required: true },
    { key: 'department', label: 'Department / team', required: true },
    { key: 'yearsExperience', label: 'Years of management experience', required: true },
    {
      key: 'roleSummary',
      label: 'Brief role summary',
      required: true,
      type: 'textarea',
    },
  ],
  documentNeeds: [
    { key: 'photoId', title: 'Photo ID', description: 'Driver licence or passport', required: true },
    { key: 'cv', title: 'CV / resume', description: 'PDF preferred', required: true },
    {
      key: 'certificates',
      title: 'Professional certificates',
      description: 'Leadership or compliance certs',
      required: false,
    },
  ],
};

const ROSTER_TEMPLATE: RoleOnboardingTemplate = {
  role: 'ROSTERING_EXPERT',
  roleLabel: 'Rostering Expert',
  steps: STEPS,
  personalHint: 'Use your legal name as it appears on your identity documents.',
  workHint: 'Help us understand how you plan and cover shifts across the organisation.',
  personalFields: SHARED_PERSONAL_FIELDS,
  workFields: [
    { key: 'jobTitle', label: 'Job title', required: true },
    {
      key: 'toolsExperience',
      label: 'Rostering tools / experience',
      required: true,
      type: 'textarea',
    },
    { key: 'coverageHours', label: 'Typical coverage hours', required: true },
    { key: 'regions', label: 'Regions / sites you will schedule', required: true },
  ],
  documentNeeds: [
    { key: 'photoId', title: 'Photo ID', description: 'Driver licence or passport', required: true },
    { key: 'cv', title: 'CV / resume', description: 'PDF preferred', required: true },
    {
      key: 'certificates',
      title: 'Relevant certificates',
      description: 'Optional training evidence',
      required: false,
    },
  ],
};

export const ONBOARDING_TEMPLATES: Record<
  WorkforceOnboardingRole,
  RoleOnboardingTemplate
> = {
  EMPLOYEE: EMPLOYEE_TEMPLATE,
  MANAGER: MANAGER_TEMPLATE,
  ROSTERING_EXPERT: ROSTER_TEMPLATE,
};

export function isWorkforceOnboardingRole(
  role: string,
): role is WorkforceOnboardingRole {
  return role === 'EMPLOYEE' || role === 'MANAGER' || role === 'ROSTERING_EXPERT';
}

export function getOnboardingTemplateForRole(
  role: string,
): RoleOnboardingTemplate | null {
  if (!isWorkforceOnboardingRole(role)) return null;
  return ONBOARDING_TEMPLATES[role];
}

export type WorkforceOnboardingRole = "EMPLOYEE" | "MANAGER" | "ROSTERING_EXPERT";

export type OnboardingStepId =
  | "personal"
  | "work"
  | "documents"
  | "review"
  | "submit";

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "date" | "textarea" | "select" | "chips";
  placeholder?: string;
  options?: { value: string; label: string }[];
  fullWidth?: boolean;
  readOnly?: boolean;
  hint?: string;
};

export type DocumentNeed = {
  key: string;
  title: string;
  description: string;
  required: boolean;
};

export type RoleOnboardingTemplate = {
  role: WorkforceOnboardingRole;
  roleLabel: string;
  personalHint: string;
  workHint: string;
  personalFields: FieldDef[];
  workFields: FieldDef[];
  documentNeeds: DocumentNeed[];
};

export const ONBOARDING_STEP_META: Array<{
  id: OnboardingStepId;
  label: string;
}> = [
  { id: "personal", label: "Personal information" },
  { id: "work", label: "Work details" },
  { id: "documents", label: "Documents" },
  { id: "review", label: "Review" },
  { id: "submit", label: "Submit" },
];

const SERVICE_LINE_OPTIONS = [
  { value: "NDIS", label: "NDIS" },
  { value: "AGED_CARE", label: "Aged Care" },
  { value: "FIELD_SERVICES", label: "Field Services" },
];

const EMPLOYEE_TEMPLATE: RoleOnboardingTemplate = {
  role: "EMPLOYEE",
  roleLabel: "Employee",
  personalHint: "Use your legal name as it appears on your identity documents.",
  workHint: "Tell us how you can support participants and when you’re available.",
  personalFields: [
    { key: "firstName", label: "First name", required: true, readOnly: true },
    { key: "lastName", label: "Last name", required: true, readOnly: true },
    { key: "preferredName", label: "Preferred name", placeholder: "How you’d like to be addressed" },
    { key: "dateOfBirth", label: "Date of birth", required: true, type: "date" },
    { key: "email", label: "Email address", required: true, type: "email", readOnly: true },
    { key: "mobile", label: "Mobile number", required: true, type: "tel", placeholder: "04xx xxx xxx" },
    {
      key: "homeAddress",
      label: "Home address",
      required: true,
      fullWidth: true,
      placeholder: "Street, suburb, state, postcode",
    },
    { key: "emergencyName", label: "Emergency contact name", required: true },
    { key: "emergencyPhone", label: "Emergency contact phone", required: true, type: "tel" },
  ],
  workFields: [
    {
      key: "serviceLines",
      label: "Service lines",
      required: true,
      type: "chips",
      options: SERVICE_LINE_OPTIONS,
      fullWidth: true,
    },
    {
      key: "preferredHours",
      label: "Preferred hours",
      required: true,
      placeholder: "e.g. Weekday mornings, weekends",
    },
    {
      key: "startDatePreference",
      label: "Preferred start date",
      type: "date",
    },
    {
      key: "availabilityNotes",
      label: "Availability notes",
      required: true,
      type: "textarea",
      fullWidth: true,
      placeholder: "Shifts you can cover, travel radius, constraints",
    },
    { key: "wwccNumber", label: "WWCC number", required: true },
    { key: "wwccExpiry", label: "WWCC expiry", required: true, type: "date" },
    { key: "policeCheckDate", label: "Police check date", type: "date" },
    { key: "firstAidExpiry", label: "First aid expiry", type: "date" },
  ],
  documentNeeds: [
    {
      key: "photoId",
      title: "Photo ID",
      description: "Driver licence or passport",
      required: true,
    },
    {
      key: "qualifications",
      title: "Qualifications",
      description: "PDF, JPG or PNG",
      required: true,
    },
    {
      key: "wwcc",
      title: "WWCC",
      description: "Working with Children Check",
      required: true,
    },
    {
      key: "policeCheck",
      title: "Police check",
      description: "National police certificate",
      required: true,
    },
    {
      key: "firstAid",
      title: "First aid",
      description: "Optional if current",
      required: false,
    },
  ],
};

const MANAGER_TEMPLATE: RoleOnboardingTemplate = {
  role: "MANAGER",
  roleLabel: "Manager",
  personalHint: "Use your legal name as it appears on your identity documents.",
  workHint: "Share your management role details so we can set up your workspace correctly.",
  personalFields: [
    { key: "firstName", label: "First name", required: true, readOnly: true },
    { key: "lastName", label: "Last name", required: true, readOnly: true },
    { key: "preferredName", label: "Preferred name" },
    { key: "dateOfBirth", label: "Date of birth", required: true, type: "date" },
    { key: "email", label: "Email address", required: true, type: "email", readOnly: true },
    { key: "mobile", label: "Mobile number", required: true, type: "tel" },
    {
      key: "homeAddress",
      label: "Home address",
      required: true,
      fullWidth: true,
    },
    { key: "emergencyName", label: "Emergency contact name", required: true },
    { key: "emergencyPhone", label: "Emergency contact phone", required: true, type: "tel" },
  ],
  workFields: [
    { key: "jobTitle", label: "Job title", required: true, placeholder: "e.g. Service Manager" },
    { key: "department", label: "Department / team", required: true },
    {
      key: "yearsExperience",
      label: "Years of management experience",
      required: true,
      placeholder: "e.g. 5",
    },
    {
      key: "roleSummary",
      label: "Brief role summary",
      required: true,
      type: "textarea",
      fullWidth: true,
      placeholder: "What you’ll oversee day to day",
    },
  ],
  documentNeeds: [
    {
      key: "photoId",
      title: "Photo ID",
      description: "Driver licence or passport",
      required: true,
    },
    {
      key: "cv",
      title: "CV / resume",
      description: "PDF preferred",
      required: true,
    },
    {
      key: "certificates",
      title: "Professional certificates",
      description: "Leadership or compliance certs",
      required: false,
    },
  ],
};

const ROSTER_TEMPLATE: RoleOnboardingTemplate = {
  role: "ROSTERING_EXPERT",
  roleLabel: "Rostering Expert",
  personalHint: "Use your legal name as it appears on your identity documents.",
  workHint: "Help us understand how you plan and cover shifts across the organisation.",
  personalFields: [
    { key: "firstName", label: "First name", required: true, readOnly: true },
    { key: "lastName", label: "Last name", required: true, readOnly: true },
    { key: "preferredName", label: "Preferred name" },
    { key: "dateOfBirth", label: "Date of birth", required: true, type: "date" },
    { key: "email", label: "Email address", required: true, type: "email", readOnly: true },
    { key: "mobile", label: "Mobile number", required: true, type: "tel" },
    {
      key: "homeAddress",
      label: "Home address",
      required: true,
      fullWidth: true,
    },
    { key: "emergencyName", label: "Emergency contact name", required: true },
    { key: "emergencyPhone", label: "Emergency contact phone", required: true, type: "tel" },
  ],
  workFields: [
    { key: "jobTitle", label: "Job title", required: true, placeholder: "e.g. Rostering Coordinator" },
    {
      key: "toolsExperience",
      label: "Rostering tools / experience",
      required: true,
      type: "textarea",
      fullWidth: true,
      placeholder: "Systems you’ve used and years of experience",
    },
    {
      key: "coverageHours",
      label: "Typical coverage hours",
      required: true,
      placeholder: "e.g. Mon–Fri 7am–7pm",
    },
    {
      key: "regions",
      label: "Regions / sites you’ll schedule",
      required: true,
      fullWidth: true,
      placeholder: "e.g. Inner west, Northern beaches",
    },
  ],
  documentNeeds: [
    {
      key: "photoId",
      title: "Photo ID",
      description: "Driver licence or passport",
      required: true,
    },
    {
      key: "cv",
      title: "CV / resume",
      description: "PDF preferred",
      required: true,
    },
    {
      key: "certificates",
      title: "Relevant certificates",
      description: "Optional training evidence",
      required: false,
    },
  ],
};

const TEMPLATES: Record<WorkforceOnboardingRole, RoleOnboardingTemplate> = {
  EMPLOYEE: EMPLOYEE_TEMPLATE,
  MANAGER: MANAGER_TEMPLATE,
  ROSTERING_EXPERT: ROSTER_TEMPLATE,
};

export function getOnboardingTemplate(role?: string | null): RoleOnboardingTemplate {
  if (role === "MANAGER" || role === "ROSTERING_EXPERT" || role === "EMPLOYEE") {
    return TEMPLATES[role];
  }
  return EMPLOYEE_TEMPLATE;
}

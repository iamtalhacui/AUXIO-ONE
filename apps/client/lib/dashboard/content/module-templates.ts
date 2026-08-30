export type ModuleCeilingTemplate = "BASIC" | "ADVANCED" | "CUSTOM";

export const MODULE_CEILING_TEMPLATES: {
  value: ModuleCeilingTemplate;
  label: string;
  description: string;
}[] = [
  {
    value: "BASIC",
    label: "Basic",
    description: "Core setup, workforce, rostering, shifts, and documents.",
  },
  {
    value: "ADVANCED",
    label: "Advanced",
    description: "Basic package plus dashboard, notes, incidents, and finance handoff.",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    description: "Pick exactly which modules this organisation may ever enable.",
  },
];

export const BASIC_MODULE_CODES = ["03", "05", "06", "07", "10"] as const;

export const ADVANCED_MODULE_CODES = [
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "12",
] as const;

export const ASSIGNABLE_MODULE_CODES = [
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "17",
] as const;

export function getModuleCodesForTemplate(template: ModuleCeilingTemplate) {
  switch (template) {
    case "BASIC":
      return [...BASIC_MODULE_CODES];
    case "ADVANCED":
      return [...ADVANCED_MODULE_CODES];
    case "CUSTOM":
      return [];
    default:
      return [];
  }
}

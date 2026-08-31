import type { OnboardingData, OnboardingStep, OnboardingStepId } from "./types";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "contact",
    index: 0,
    label: "Contact details",
    shortLabel: "Contact",
    description: "Phone, address, and emergency contact information.",
    owner: "You",
  },
  {
    id: "personal",
    index: 1,
    label: "Personal profile",
    shortLabel: "Profile",
    description: "Date of birth, languages, and a short bio.",
    owner: "You",
  },
  {
    id: "documents",
    index: 2,
    label: "Documents",
    shortLabel: "Documents",
    description: "Upload ID, qualifications, and compliance certificates.",
    owner: "You",
  },
  {
    id: "compliance",
    index: 3,
    label: "Service & availability",
    shortLabel: "Service",
    description: "Service lines, availability, and declarations.",
    owner: "You",
  },
  {
    id: "review",
    index: 4,
    label: "Review & submit",
    shortLabel: "Review",
    description: "Confirm your details and submit for organisation approval.",
    owner: "You",
  },
];

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export const SERVICE_LINE_OPTIONS = [
  {
    value: "NDIS" as const,
    label: "NDIS",
    description: "National Disability Insurance Scheme supports",
  },
  {
    value: "AGED_CARE" as const,
    label: "Aged Care",
    description: "In-home and residential aged care services",
  },
  {
    value: "FIELD_SERVICES" as const,
    label: "Field Services",
    description: "Community and field-based support work",
  },
];

export function getStepById(id: OnboardingStepId) {
  return ONBOARDING_STEPS.find((step) => step.id === id)!;
}

export function isStepComplete(stepId: OnboardingStepId, data: OnboardingData): boolean {
  switch (stepId) {
    case "contact":
      return Boolean(
        data.contact.phone &&
          data.contact.addressLine1 &&
          data.contact.suburb &&
          data.contact.state &&
          data.contact.postcode &&
          data.contact.emergencyName &&
          data.contact.emergencyPhone,
      );
    case "personal":
      return Boolean(data.personal.dateOfBirth && data.personal.gender);
    case "documents":
      return Boolean(
        data.documents.photoId?.storedName &&
          data.documents.qualifications?.storedName &&
          data.documents.wwcc?.storedName,
      );
    case "compliance":
      return Boolean(
        data.compliance.serviceLines.length > 0 &&
          data.compliance.availabilityNotes &&
          data.compliance.declarations.termsAccepted &&
          data.compliance.declarations.accuracyConfirmed,
      );
    case "review":
      return ONBOARDING_STEPS.slice(0, 4).every((step) =>
        isStepComplete(step.id, data),
      );
    default:
      return false;
  }
}

export function countCompletedSteps(data: OnboardingData) {
  return ONBOARDING_STEPS.filter(
    (step) => step.id !== "review" && isStepComplete(step.id, data),
  ).length;
}

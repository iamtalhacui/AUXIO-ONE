import type { DocumentNeed, FieldDef, OnboardingStepId } from "./templates";

export type UploadedFileMeta = {
  id?: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  storedName: string;
};

export type OnboardingFormValues = Record<string, string | string[]>;

export type OnboardingDocumentsMap = Record<string, UploadedFileMeta | null>;

export type DashboardOnboardingState = {
  personal: OnboardingFormValues;
  work: OnboardingFormValues;
  documents: OnboardingDocumentsMap;
};

export function emptyValuesFromFields(fields: FieldDef[]): OnboardingFormValues {
  const values: OnboardingFormValues = {};
  for (const field of fields) {
    values[field.key] = field.type === "chips" ? [] : "";
  }
  return values;
}

export function emptyDocumentsFromNeeds(needs: DocumentNeed[]): OnboardingDocumentsMap {
  const docs: OnboardingDocumentsMap = {};
  for (const need of needs) {
    docs[need.key] = null;
  }
  return docs;
}

export function isFieldFilled(field: FieldDef, values: OnboardingFormValues): boolean {
  if (!field.required) return true;
  const value = values[field.key];
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(String(value ?? "").trim());
}

export function isStepValid(
  stepId: OnboardingStepId,
  state: DashboardOnboardingState,
  personalFields: FieldDef[],
  workFields: FieldDef[],
  documentNeeds: DocumentNeed[],
): boolean {
  switch (stepId) {
    case "personal":
      return personalFields.every((field) => isFieldFilled(field, state.personal));
    case "work":
      return workFields.every((field) => isFieldFilled(field, state.work));
    case "documents":
      return documentNeeds
        .filter((need) => need.required)
        .every((need) => Boolean(state.documents[need.key]?.storedName));
    case "review":
    case "submit":
      return (
        isStepValid("personal", state, personalFields, workFields, documentNeeds) &&
        isStepValid("work", state, personalFields, workFields, documentNeeds) &&
        isStepValid("documents", state, personalFields, workFields, documentNeeds)
      );
    default:
      return false;
  }
}

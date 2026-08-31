export type ServiceLine = "NDIS" | "AGED_CARE" | "FIELD_SERVICES";

export type UploadedFileMeta = {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  storedName: string;
};

export type OnboardingContact = {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
};

export type OnboardingPersonal = {
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  languages: string;
  bio: string;
};

export type OnboardingDocuments = {
  photoId: UploadedFileMeta | null;
  qualifications: UploadedFileMeta | null;
  wwcc: UploadedFileMeta | null;
  policeCheck: UploadedFileMeta | null;
  firstAid: UploadedFileMeta | null;
};

export type OnboardingCompliance = {
  serviceLines: ServiceLine[];
  availabilityNotes: string;
  preferredHours: string;
  declarations: {
    termsAccepted: boolean;
    accuracyConfirmed: boolean;
    consentBackgroundCheck: boolean;
  };
};

export type OnboardingData = {
  contact: OnboardingContact;
  personal: OnboardingPersonal;
  documents: OnboardingDocuments;
  compliance: OnboardingCompliance;
};

export type OnboardingStepId =
  | "contact"
  | "personal"
  | "documents"
  | "compliance"
  | "review";

export type OnboardingStep = {
  id: OnboardingStepId;
  index: number;
  label: string;
  shortLabel: string;
  description: string;
  owner: string;
};

export const EMPTY_ONBOARDING_DATA: OnboardingData = {
  contact: {
    phone: "",
    addressLine1: "",
    addressLine2: "",
    suburb: "",
    state: "",
    postcode: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
  },
  personal: {
    preferredName: "",
    dateOfBirth: "",
    gender: "",
    languages: "",
    bio: "",
  },
  documents: {
    photoId: null,
    qualifications: null,
    wwcc: null,
    policeCheck: null,
    firstAid: null,
  },
  compliance: {
    serviceLines: [],
    availabilityNotes: "",
    preferredHours: "",
    declarations: {
      termsAccepted: false,
      accuracyConfirmed: false,
      consentBackgroundCheck: false,
    },
  },
};

export function mergeOnboardingData(
  partial: Record<string, unknown> | undefined,
): OnboardingData {
  if (!partial) return EMPTY_ONBOARDING_DATA;

  const contact = (partial.contact ?? {}) as Partial<OnboardingContact>;
  const personal = (partial.personal ?? {}) as Partial<OnboardingPersonal>;
  const documents = (partial.documents ?? {}) as Partial<OnboardingDocuments>;
  const compliance = (partial.compliance ?? {}) as Partial<OnboardingCompliance>;
  const declarations = (compliance.declarations ?? {}) as Partial<
    OnboardingCompliance["declarations"]
  >;

  return {
    contact: { ...EMPTY_ONBOARDING_DATA.contact, ...contact },
    personal: { ...EMPTY_ONBOARDING_DATA.personal, ...personal },
    documents: { ...EMPTY_ONBOARDING_DATA.documents, ...documents },
    compliance: {
      ...EMPTY_ONBOARDING_DATA.compliance,
      ...compliance,
      serviceLines: compliance.serviceLines ?? [],
      declarations: {
        ...EMPTY_ONBOARDING_DATA.compliance.declarations,
        ...declarations,
      },
    },
  };
}

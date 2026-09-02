import type { RequirementRecordType, ServiceLine } from '@repo/database';

export type DefaultRequirementItem = {
  itemType: 'DOCUMENT' | 'FIELD';
  code: string;
  label: string;
  mandatory: boolean;
  requiresExpiry: boolean;
};

const EMPLOYEE_DOCUMENTS: DefaultRequirementItem[] = [
  {
    itemType: 'DOCUMENT',
    code: 'photoId',
    label: 'Photo ID',
    mandatory: true,
    requiresExpiry: false,
  },
  {
    itemType: 'DOCUMENT',
    code: 'qualifications',
    label: 'Qualifications',
    mandatory: true,
    requiresExpiry: false,
  },
  {
    itemType: 'DOCUMENT',
    code: 'wwcc',
    label: 'Working with children check',
    mandatory: true,
    requiresExpiry: true,
  },
  {
    itemType: 'DOCUMENT',
    code: 'policeCheck',
    label: 'National police check',
    mandatory: false,
    requiresExpiry: true,
  },
  {
    itemType: 'DOCUMENT',
    code: 'firstAid',
    label: 'First aid certificate',
    mandatory: false,
    requiresExpiry: true,
  },
];

const PARTICIPANT_DOCUMENTS: DefaultRequirementItem[] = [
  {
    itemType: 'DOCUMENT',
    code: 'serviceAgreement',
    label: 'Service agreement',
    mandatory: true,
    requiresExpiry: false,
  },
  {
    itemType: 'DOCUMENT',
    code: 'riskAssessment',
    label: 'Risk assessment',
    mandatory: true,
    requiresExpiry: false,
  },
  {
    itemType: 'DOCUMENT',
    code: 'consentForm',
    label: 'Consent form',
    mandatory: true,
    requiresExpiry: false,
  },
];

export const SERVICE_LINES: ServiceLine[] = [
  'NDIS',
  'AGED_CARE',
  'FIELD_SERVICES',
];

export const REQUIREMENT_RECORD_TYPES: RequirementRecordType[] = [
  'EMPLOYEE',
  'PARTICIPANT',
];

export function defaultItemsFor(
  recordType: RequirementRecordType,
): DefaultRequirementItem[] {
  return recordType === 'EMPLOYEE' ? EMPLOYEE_DOCUMENTS : PARTICIPANT_DOCUMENTS;
}

export function requirementSetName(
  serviceLine: ServiceLine,
  recordType: RequirementRecordType,
) {
  const lineLabel = serviceLine.replace('_', ' ');
  const recordLabel = recordType === 'EMPLOYEE' ? 'Worker' : 'Participant';
  return `${lineLabel} ${recordLabel} requirements`;
}

// Shared mandatory document slots — same for every customer (no per-service templates).
export const MANDATORY_CUSTOMER_DOCS = [
  { fieldKey: 'ID_CARD', label: 'Identity document' },
] as const;

export type MandatoryCustomerDocKey = (typeof MANDATORY_CUSTOMER_DOCS)[number]['fieldKey'];

export function isMandatoryFieldKey(fieldKey: string) {
  return MANDATORY_CUSTOMER_DOCS.some((doc) => doc.fieldKey === fieldKey);
}

export function mandatoryLabel(fieldKey: string) {
  return MANDATORY_CUSTOMER_DOCS.find((doc) => doc.fieldKey === fieldKey)?.label ?? fieldKey;
}

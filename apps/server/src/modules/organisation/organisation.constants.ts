import type { Prisma } from '@repo/database';

export const orgAdminProfileSelect = {
  id: true,
  legalName: true,
  tradingName: true,
  contactEmail: true,
  contactPhone: true,
  timeZone: true,
  tagline: true,
  brandColor: true,
  logoData: true,
  updatedAt: true,
} satisfies Prisma.OrganisationSelect;

export type OrgAdminProfileRecord = Prisma.OrganisationGetPayload<{
  select: typeof orgAdminProfileSelect;
}>;

export function mapOrgAdminProfile(organisation: OrgAdminProfileRecord) {
  return {
    id: organisation.id,
    legalName: organisation.legalName,
    tradingName: organisation.tradingName,
    contactEmail: organisation.contactEmail,
    contactPhone: organisation.contactPhone,
    timeZone: organisation.timeZone,
    tagline: organisation.tagline,
    brandColor: organisation.brandColor ?? '#115e59',
    logoData: organisation.logoData,
    updatedAt: organisation.updatedAt,
  };
}

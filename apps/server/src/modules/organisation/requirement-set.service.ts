import { Injectable } from '@nestjs/common';
import type { Prisma } from '@repo/database';
import {
  defaultItemsFor,
  REQUIREMENT_RECORD_TYPES,
  requirementSetName,
  SERVICE_LINES,
} from './requirement-set.constants';

@Injectable()
export class RequirementSetService {
  async provisionForOrganisation(
    organisationId: string,
    tx: Prisma.TransactionClient,
  ) {
    for (const serviceLine of SERVICE_LINES) {
      for (const recordType of REQUIREMENT_RECORD_TYPES) {
        const items = defaultItemsFor(recordType);
        await tx.requirementSet.create({
          data: {
            organisationId,
            serviceLine,
            recordType,
            name: requirementSetName(serviceLine, recordType),
            items: {
              create: items.map((item) => ({
                itemType: item.itemType,
                code: item.code,
                label: item.label,
                mandatory: item.mandatory,
                requiresExpiry: item.requiresExpiry,
              })),
            },
          },
        });
      }
    }
  }
}

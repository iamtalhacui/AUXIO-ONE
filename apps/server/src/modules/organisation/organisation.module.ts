import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesModule } from '../roles/roles.module';
import { OrganisationController } from './organisation.controller';
import { OrganisationCoreService } from './organisation-core.service';
import { SuperAdminOrganisationService } from './super-admin-organisation.service';
import { OrgAdminOrganisationService } from './org-admin-organisation.service';
import { RequirementSetService } from './requirement-set.service';

@Module({
  imports: [AuthModule, RolesModule],
  controllers: [OrganisationController],
  providers: [
    OrganisationCoreService,
    SuperAdminOrganisationService,
    OrgAdminOrganisationService,
    RequirementSetService,
  ],
  exports: [OrganisationCoreService],
})
export class OrganisationModule {}

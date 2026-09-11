import { Module } from '@nestjs/common';
import { ModuleAccessGuard } from '../../common/guards/module-access.guard';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { AuthModule } from '../auth/auth.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import { PlatformModule } from '../platform/platform.module';
import { OrganisationController } from './organisation.controller';
import { OrgModulesController } from './org-modules.controller';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

@Module({
  imports: [PlatformAuthModule, AuthModule, PlatformModule, OnboardingModule],
  controllers: [
    OrganisationsController,
    OrganisationController,
    OrgModulesController,
  ],
  providers: [OrganisationsService, ModuleAccessGuard, LocalFileStorageService],
  exports: [OrganisationsService, ModuleAccessGuard],
})
export class OrganisationsModule {}


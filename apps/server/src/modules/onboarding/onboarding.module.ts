import { Module } from '@nestjs/common';
import { VerifiedOnboardingGuard } from '../../common/guards/verified-onboarding.guard';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingTemplatesService } from './onboarding-templates.service';
import { OrganisationOnboardingController } from './organisation-onboarding.controller';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [OnboardingController, OrganisationOnboardingController],
  providers: [
    OnboardingTemplatesService,
    OnboardingService,
    VerifiedOnboardingGuard,
    LocalFileStorageService,
  ],
  exports: [OnboardingTemplatesService, OnboardingService, VerifiedOnboardingGuard],
})
export class OnboardingModule {}

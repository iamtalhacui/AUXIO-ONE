import { Module } from '@nestjs/common';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { AuthModule } from '../auth/auth.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlatformModule } from '../platform/platform.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [
    AuthModule,
    OrganisationsModule,
    PlatformModule,
    OnboardingModule,
    PermissionsModule,
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, LocalFileStorageService],
  exports: [IncidentsService],
})
export class IncidentsModule {}

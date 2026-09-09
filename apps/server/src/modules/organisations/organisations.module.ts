import { Module } from '@nestjs/common';
import { ModuleAccessGuard } from '../../common/guards/module-access.guard';
import { AuthModule } from '../auth/auth.module';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import { OrgModulesController } from './org-modules.controller';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

@Module({
  imports: [PlatformAuthModule, AuthModule],
  controllers: [OrganisationsController, OrgModulesController],
  providers: [OrganisationsService, ModuleAccessGuard],
  exports: [OrganisationsService, ModuleAccessGuard],
})
export class OrganisationsModule {}

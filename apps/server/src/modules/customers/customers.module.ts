import { Module } from '@nestjs/common';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { AuthModule } from '../auth/auth.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlatformModule } from '../platform/platform.module';
import { CrmController } from './crm.controller';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { ManagerOverviewController } from './manager-overview.controller';

@Module({
  imports: [AuthModule, OrganisationsModule, PlatformModule, PermissionsModule],
  controllers: [CustomersController, CrmController, ManagerOverviewController],
  providers: [CustomersService, LocalFileStorageService],
  exports: [CustomersService],
})
export class CustomersModule {}

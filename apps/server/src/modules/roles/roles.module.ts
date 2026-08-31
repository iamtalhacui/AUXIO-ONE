import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrgRolesController } from './org-roles.controller';
import { OrgRolesService } from './org-roles.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [AuthModule],
  controllers: [OrgRolesController],
  providers: [OrgRolesService, PermissionsService, PermissionsGuard],
  exports: [OrgRolesService, PermissionsService, PermissionsGuard],
})
export class RolesModule {}

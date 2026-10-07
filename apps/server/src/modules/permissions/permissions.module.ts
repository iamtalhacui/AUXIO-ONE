import { Module, forwardRef } from '@nestjs/common';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { AuthModule } from '../auth/auth.module';
import { PermissionsService } from './permissions.service';
import { RolePermissionsController } from './role-permissions.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [RolePermissionsController],
  providers: [PermissionsService, PermissionGuard],
  exports: [PermissionsService, PermissionGuard],
})
export class PermissionsModule {}

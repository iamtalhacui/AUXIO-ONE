import { Global, Module } from '@nestjs/common';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { PermissionsService } from './permissions.service';

/**
 * Global so any controller can use PermissionGuard without its own module
 * having to import this one.
 */
@Global()
@Module({
  providers: [PermissionsService, PermissionGuard],
  exports: [PermissionsService, PermissionGuard],
})
export class PermissionsModule {}

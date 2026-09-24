import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsString,
  MaxLength, ValidateNested,
} from 'class-validator';
import { CONFIGURABLE_ROLES } from '../permissions.service';
import type { ConfigurableRole } from '../permissions.service';

export class RolePermissionChangeDto {
  @IsIn([...CONFIGURABLE_ROLES])
  role: ConfigurableRole;

  @IsString()
  @MaxLength(100)
  permissionCode: string;

  @IsBoolean()
  enabled: boolean;
}

// Body for PATCH /organisation/permissions
export class UpdateRolePermissionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => RolePermissionChangeDto)
  changes: RolePermissionChangeDto[];
}

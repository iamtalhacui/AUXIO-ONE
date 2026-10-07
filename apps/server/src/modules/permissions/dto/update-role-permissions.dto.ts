import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';

class PermissionFlagsDto {
  @IsOptional()
  @IsObject()
  pages?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  actions?: Record<string, boolean>;
}

export class UpdateRolePermissionsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionFlagsDto)
  MANAGER?: PermissionFlagsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionFlagsDto)
  ROSTERING_EXPERT?: PermissionFlagsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionFlagsDto)
  EMPLOYEE?: PermissionFlagsDto;
}

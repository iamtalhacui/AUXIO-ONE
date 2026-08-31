import { Type } from 'class-transformer';
import { IsIn, IsObject, IsString, ValidateNested } from 'class-validator';
import { CONFIGURABLE_ROLE_CODES } from '../org-permissions.constants';

export class UpdateOrgRoleItemDto {
  @IsString()
  @IsIn([...CONFIGURABLE_ROLE_CODES])
  code: string;

  @IsObject()
  capabilities: Record<string, boolean>;
}

export class UpdateOrgRolesDto {
  @ValidateNested({ each: true })
  @Type(() => UpdateOrgRoleItemDto)
  roles: UpdateOrgRoleItemDto[];
}

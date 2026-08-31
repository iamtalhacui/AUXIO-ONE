import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { ConfigurableRoleCode } from '../../roles/org-permissions.constants';

const ADMIN_EDITABLE_STATUSES = [
  'VERIFIED',
  'ACTIVE',
  'DEACTIVATED',
  'RESTRICTED',
  'SUBMITTED',
  'PROCESSING',
] as const;

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['MANAGER', 'ROSTERING_EXPERT', 'EMPLOYEE'])
  role?: ConfigurableRoleCode;

  @IsOptional()
  @IsIn(ADMIN_EDITABLE_STATUSES)
  status?: (typeof ADMIN_EDITABLE_STATUSES)[number];
}

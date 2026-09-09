import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserStatus } from 'database';
import { WorkforceRole } from './register-member.dto';

// All fields optional so the edit form can send only what changed.
export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(WorkforceRole)
  role?: WorkforceRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

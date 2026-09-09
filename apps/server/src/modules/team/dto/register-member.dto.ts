import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum WorkforceRole {
  MANAGER = 'MANAGER',
  ROSTERING_EXPERT = 'ROSTERING_EXPERT',
  EMPLOYEE = 'EMPLOYEE',
}

// Invite payload: workforce roles only (not ORG_ADMIN).
export class RegisterMemberDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsEnum(WorkforceRole)
  role: WorkforceRole;
}

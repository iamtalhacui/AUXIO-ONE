import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum WorkforceRole {
  MANAGER = 'MANAGER',
  ROSTERING_EXPERT = 'ROSTERING_EXPERT',
  EMPLOYEE = 'EMPLOYEE',
}

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

import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Super Admin replaces the Org Admin email on the same user row and resends invite.
export class ChangeOrgAdminEmailDto {
  @IsEmail()
  adminEmail: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  adminFirstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  adminLastName?: string;
}

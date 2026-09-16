import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Org Admin updates profile for their own tenant.
export class UpdateOrganisationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  tagline?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  timezone: string;
}

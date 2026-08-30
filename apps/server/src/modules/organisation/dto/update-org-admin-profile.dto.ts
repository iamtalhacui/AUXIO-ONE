import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateOrgAdminProfileDto {
  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  tradingName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'brandColor must be a hex colour like #115e59',
  })
  brandColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  logoData?: string | null;
}

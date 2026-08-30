import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

const ORG_STATUSES = ['ACTIVE', 'SUSPENDED', 'CLOSED'] as const;

export class UpdateOrganisationDto {
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
  @IsIn(ORG_STATUSES)
  status?: (typeof ORG_STATUSES)[number];
}

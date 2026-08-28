import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateOrganisationDto {
  @IsString()
  legalName: string;

  @IsOptional()
  @IsString()
  tradingName?: string;

  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsString()
  timeZone: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  moduleCeilingCodes: string[];

  @IsEmail()
  orgAdminEmail: string;

  @IsString()
  orgAdminName: string;
}

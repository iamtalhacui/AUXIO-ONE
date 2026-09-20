import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrgPlan } from 'database';

export class RegisterOrganisationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsEmail()
  contactEmail: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEnum(OrgPlan)
  plan: OrgPlan;

  /** Add-on modules for the Custom plan. Core modules are granted regardless. */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  moduleCodes?: string[];

  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @IsString()
  @IsNotEmpty()
  adminLastName: string;

  @IsEmail()
  adminEmail: string;
}

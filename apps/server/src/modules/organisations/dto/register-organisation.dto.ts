import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BillingCycle, OrgPlan } from 'database';

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

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  /** ISO date (YYYY-MM-DD). Period start; next renewal is derived from billing cycle. */
  @IsDateString()
  startDate: string;

  @IsBoolean()
  autoRenewal: boolean;

  /** Days after expiry before the organisation is suspended. Defaults to 3. */
  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodDays?: number;

  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @IsString()
  @IsNotEmpty()
  adminLastName: string;

  @IsEmail()
  adminEmail: string;
}

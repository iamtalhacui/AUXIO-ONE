import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const OPPORTUNITY_STAGES = [
  'ENQUIRY',
  'QUALIFIED',
  'PROPOSAL',
  'ACCEPTED',
  'LOST',
] as const;

export class CreateOpportunityDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  serviceLine?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== '' && v != null)
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsIn(OPPORTUNITY_STAGES)
  stage?: (typeof OPPORTUNITY_STAGES)[number];

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedAnnualValue?: number;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @IsOptional()
  @IsString()
  followUpNote?: string;
}

export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  serviceLine?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== '' && v != null)
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsIn(OPPORTUNITY_STAGES)
  stage?: (typeof OPPORTUNITY_STAGES)[number];

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedAnnualValue?: number;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @IsOptional()
  @IsString()
  followUpNote?: string;
}

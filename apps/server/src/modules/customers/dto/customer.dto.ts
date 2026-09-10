import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Manager creates a customer master record (no login account).
export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  preferredName?: string;

  @IsString()
  @MinLength(1)
  surname: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // Name only — does not select checklists or templates.
  @IsOptional()
  @IsString()
  serviceLine?: string;

  @IsOptional()
  @IsDateString()
  planStartDate?: string;

  @IsOptional()
  @IsDateString()
  planEndDate?: string;

  @IsOptional()
  @IsString()
  supportSummary?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  risks?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  preferredName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  surname?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== '' && v != null)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  serviceLine?: string;

  @IsOptional()
  @IsDateString()
  planStartDate?: string;

  @IsOptional()
  @IsDateString()
  planEndDate?: string;

  @IsOptional()
  @IsString()
  supportSummary?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  risks?: string;
}

export class UploadOptionalDocumentDto {
  @IsString()
  @MinLength(1)
  label: string;
}

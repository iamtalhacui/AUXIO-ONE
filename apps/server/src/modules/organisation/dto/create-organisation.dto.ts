import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ModuleCeilingTemplate } from '../module-ceiling.constants';

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

  @IsEnum(ModuleCeilingTemplate)
  moduleCeilingTemplate: ModuleCeilingTemplate;

  @ValidateIf((dto) => dto.moduleCeilingTemplate === ModuleCeilingTemplate.CUSTOM)
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  moduleCeilingCodes?: string[];

  @IsEmail()
  orgAdminEmail: string;

  @IsString()
  orgAdminName: string;

  @IsString()
  @MinLength(8)
  orgAdminPassword: string;
}

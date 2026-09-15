import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDemoRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  organisationName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  contactName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100000)
  numberOfUsers?: number;

  @IsDateString()
  preferredDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  preferredTime: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  message?: string;
}

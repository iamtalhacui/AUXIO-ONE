import { IsOptional, IsString } from 'class-validator';

export class UpdatePersonalDetailsDto {
  @IsOptional()
  @IsString()
  preferredName?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  homeAddress?: string;

  @IsOptional()
  @IsString()
  emergencyName?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;
}

import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class OnboardingPayloadDto {
  @IsOptional()
  @IsObject()
  personal?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  work?: Record<string, unknown>;
}

export class SaveOnboardingDraftDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  currentStep?: number;

  @IsObject()
  @ValidateNested()
  @Type(() => OnboardingPayloadDto)
  payload!: OnboardingPayloadDto;
}

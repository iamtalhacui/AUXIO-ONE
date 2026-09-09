import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export enum OnboardingReviewDecision {
  VERIFIED = 'VERIFIED',
  CHANGES_REQUIRED = 'CHANGES_REQUIRED',
}

export class ReviewOnboardingDto {
  @IsEnum(OnboardingReviewDecision)
  decision!: OnboardingReviewDecision;

  @ValidateIf((dto: ReviewOnboardingDto) => dto.decision === OnboardingReviewDecision.CHANGES_REQUIRED)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  note?: string;
}

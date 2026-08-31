import { IsInt, IsObject, Max, Min } from 'class-validator';

export class SaveOnboardingDto {
  @IsObject()
  data!: Record<string, unknown>;

  @IsInt()
  @Min(0)
  @Max(4)
  currentStep!: number;
}

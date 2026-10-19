import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * Super Admin maintenance controls — one engine, three actions:
 * - schedule: announce a future (or immediate) window
 * - emergency: lock now (startsAt = now)
 * - clear: turn everything off
 */
export class UpdatePlatformSettingsDto {
  @IsIn(['schedule', 'emergency', 'clear'])
  action!: 'schedule' | 'emergency' | 'clear';

  /** Required for schedule. Ignored for emergency/clear. */
  @ValidateIf((dto: UpdatePlatformSettingsDto) => dto.action === 'schedule')
  @IsDateString()
  startsAt?: string;

  /** Optional end of window. Null/omit = open-ended until cleared. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsDateString()
  endsAt?: string | null;

  /** Optional banner / login message for organisations. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string | null;
}

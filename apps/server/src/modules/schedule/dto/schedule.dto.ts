import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ShiftLocationKindDto {
  PARTICIPANT = 'PARTICIPANT',
  SITE = 'SITE',
  OTHER = 'OTHER',
}

export enum RecurrenceFrequencyDto {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum SeriesEditScopeDto {
  THIS = 'THIS',
  THIS_AND_FOLLOWING = 'THIS_AND_FOLLOWING',
}

/** Shared body for creating one shift or a recurring series. */
export class CreateShiftDto {
  @IsEnum(ShiftLocationKindDto)
  locationKind: ShiftLocationKindDto;

  /** Required when locationKind is PARTICIPANT. */
  @ValidateIf((o: CreateShiftDto) => o.locationKind === ShiftLocationKindDto.PARTICIPANT)
  @IsUUID()
  customerId?: string;

  @IsString()
  @MinLength(1)
  locationLabel: string;

  @IsString()
  @MinLength(1)
  serviceLine: string;

  @IsString()
  @MinLength(1)
  serviceTitle: string;

  /** YYYY-MM-DD — first (or only) shift date. */
  @IsDateString()
  date: string;

  /** HH:mm */
  @IsString()
  startTime: string;

  /** Total length in minutes; must be a multiple of 5. */
  @IsInt()
  @Min(5)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * When true, publish immediately as an open offer to all employees.
   * First eligible employee to accept wins the shift.
   */
  @IsOptional()
  @IsBoolean()
  broadcast?: boolean;

  /** When true, recurrence fields are required and multiple drafts are created. */
  @IsBoolean()
  recurring: boolean;

  @ValidateIf((o: CreateShiftDto) => o.recurring === true)
  @IsEnum(RecurrenceFrequencyDto)
  frequency?: RecurrenceFrequencyDto;

  @ValidateIf((o: CreateShiftDto) => o.recurring === true)
  @IsInt()
  @Min(1)
  @Max(12)
  interval?: number;

  /** Inclusive end date (YYYY-MM-DD) for the recurrence window. */
  @ValidateIf((o: CreateShiftDto) => o.recurring === true)
  @IsDateString()
  untilDate?: string;
}

/** Preview only — same shape as create, without persisting. */
export class PreviewRecurrenceDto extends CreateShiftDto {}

export class UpdateShiftDto {
  @IsOptional()
  @IsEnum(ShiftLocationKindDto)
  locationKind?: ShiftLocationKindDto;

  @IsOptional()
  @IsUUID()
  customerId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  locationLabel?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  serviceLine?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  serviceTitle?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  /** How far the change should propagate in a recurring series. */
  @IsOptional()
  @IsEnum(SeriesEditScopeDto)
  seriesScope?: SeriesEditScopeDto;
}

export class PublishOfferDto {
  @IsUUID()
  workerId: string;
}

export class DayAvailabilityDto {
  /** ISO weekday 1–7 (Mon–Sun). */
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsBoolean()
  enabled: boolean;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}

export class AvailabilityExceptionDto {
  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SaveAvailabilityDto {
  @IsArray()
  @ArrayMinSize(7)
  @ValidateNested({ each: true })
  @Type(() => DayAvailabilityDto)
  weekly: DayAvailabilityDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityExceptionDto)
  exceptions: AvailabilityExceptionDto[];
}

/** Employee progress note while the shift is in progress. */
export class SaveProgressNoteDto {
  @IsString()
  progressNote: string;
}

/** Finish a shift — reason required when outside allowed start/end windows. */
export class FinishShiftDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  finishReason?: string;
}

export class ReviewShiftDto {
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

/** Replace the full task catalogue for one service line. */
export class SaveServiceLineTasksDto {
  @IsString()
  @MinLength(1)
  serviceLine: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  labels: string[];
}


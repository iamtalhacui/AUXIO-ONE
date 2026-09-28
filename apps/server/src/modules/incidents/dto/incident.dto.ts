import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export enum IncidentTypeDto {
  FALL = 'FALL',
  MEDICATION = 'MEDICATION',
  BEHAVIOUR = 'BEHAVIOUR',
  INJURY = 'INJURY',
  PROPERTY = 'PROPERTY',
  NEAR_MISS = 'NEAR_MISS',
  OTHER = 'OTHER',
}

export enum IncidentSeverityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatusDto {
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum IncidentReportabilityDecisionDto {
  NOT_ASSESSED = 'NOT_ASSESSED',
  REPORTABLE = 'REPORTABLE',
  NOT_REPORTABLE = 'NOT_REPORTABLE',
}

export enum IncidentActionKindDto {
  WELLBEING_FOLLOW_UP = 'WELLBEING_FOLLOW_UP',
  REPORTABILITY_REVIEW = 'REPORTABILITY_REVIEW',
  CUSTOM = 'CUSTOM',
}

export enum IncidentActionStatusDto {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export class CreateIncidentDto {
  @IsUUID()
  shiftId: string;

  @IsDateString()
  date: string;

  @IsString()
  @MinLength(1)
  approximateTime: string;

  @IsString()
  @MinLength(1)
  location: string;

  @IsOptional()
  @IsString()
  peopleInvolved?: string;

  @IsOptional()
  @IsUUID()
  participantId?: string;

  @IsOptional()
  @IsString()
  participantName?: string;

  @IsEnum(IncidentTypeDto)
  type: IncidentTypeDto;

  @IsEnum(IncidentSeverityDto)
  severity: IncidentSeverityDto;

  @IsString()
  @MinLength(10)
  description: string;

  @IsString()
  @MinLength(3)
  immediateAction: string;

  @IsOptional()
  @IsString()
  nextSteps?: string;
}

export class UpdateIncidentDto {
  @IsOptional()
  @IsEnum(IncidentStatusDto)
  status?: IncidentStatusDto;

  @IsOptional()
  @IsEnum(IncidentSeverityDto)
  severity?: IncidentSeverityDto;

  @IsOptional()
  @IsString()
  managementNotes?: string;

  @IsOptional()
  @IsEnum(IncidentReportabilityDecisionDto)
  reportabilityDecision?: IncidentReportabilityDecisionDto;

  @IsOptional()
  @IsString()
  reportabilityRationale?: string;

  @IsOptional()
  @IsString()
  reportabilityExternalRef?: string;

  @IsOptional()
  @IsString()
  reportabilityNotifyNotes?: string;

  @IsOptional()
  @IsBoolean()
  reportabilityNotified?: boolean;
}

export class CreateIncidentActionDto {
  @IsString()
  @MinLength(3)
  description: string;

  @IsOptional()
  @IsEnum(IncidentActionKindDto)
  kind?: IncidentActionKindDto;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateIncidentActionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsEnum(IncidentActionStatusDto)
  status?: IncidentActionStatusDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListIncidentsQueryDto {
  @IsOptional()
  @IsEnum(IncidentStatusDto)
  status?: IncidentStatusDto;

  @IsOptional()
  @IsEnum(IncidentSeverityDto)
  severity?: IncidentSeverityDto;

  @IsOptional()
  @IsEnum(IncidentTypeDto)
  type?: IncidentTypeDto;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

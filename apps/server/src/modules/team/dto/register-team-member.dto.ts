import {
  IsEmail,
  IsIn,
  IsString,
} from 'class-validator';
import { CONFIGURABLE_ROLE_CODES } from '../../roles/org-permissions.constants';

const SERVICE_LINES = ['NDIS', 'AGED_CARE', 'FIELD_SERVICES'] as const;

export class RegisterTeamMemberDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsIn([...CONFIGURABLE_ROLE_CODES])
  role: string;

  @IsIn([...SERVICE_LINES])
  serviceLine: (typeof SERVICE_LINES)[number];
}

import {
  IsEmail,
  IsIn,
  IsString,
  MinLength,
} from 'class-validator';
import { CONFIGURABLE_ROLE_CODES } from '../../roles/org-permissions.constants';

export class RegisterTeamMemberDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn([...CONFIGURABLE_ROLE_CODES])
  role: string;
}

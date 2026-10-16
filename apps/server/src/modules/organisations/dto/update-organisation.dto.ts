import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AU_TIMEZONES } from '../../../common/au-timezones';

// Org Admin updates profile for their own tenant.
export class UpdateOrganisationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  tagline?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @IsIn([...AU_TIMEZONES], {
    message: 'Timezone must be a supported Australian zone',
  })
  timezone: string;
}

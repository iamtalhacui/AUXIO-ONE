import { IsBoolean } from 'class-validator';

// Body for PATCH /organisation/modules/:code
export class SetModuleEnabledDto {
  @IsBoolean()
  enabled: boolean;
}

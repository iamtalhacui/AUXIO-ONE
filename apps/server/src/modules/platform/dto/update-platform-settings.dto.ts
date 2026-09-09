import { IsBoolean } from 'class-validator';

// Super Admin toggles maintenance mode from platform settings.
export class UpdatePlatformSettingsDto {
  @IsBoolean()
  maintenanceMode: boolean;
}

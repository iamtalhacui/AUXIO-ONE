import { IsString, MinLength } from 'class-validator';

// Body for POST /auth/change-password (logged-in org users).
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

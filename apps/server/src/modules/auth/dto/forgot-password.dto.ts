import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { PASSWORD_POLICY, PASSWORD_POLICY_MESSAGE } from '../password-policy';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  otp: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE })
  password: string;
}

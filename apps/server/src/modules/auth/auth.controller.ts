import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PermissionsService } from '../permissions/permissions.service';
import { AuthService } from './auth.service';
import { CurrentOrgUser } from './current-org-user.decorator';
import type { OrgJwtPayload } from './current-org-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { SetupAccountDto } from './dto/setup-account.dto';
import { OrgJwtGuard } from './org-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly permissions: PermissionsService,
  ) {}

  @Post('setup')
  setup(@Body() dto: SetupAccountDto) {
    return this.authService.setupAccount(dto.token, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.email, dto.password);
    const permissions = await this.permissions.resolve(
      result.user.organisationId,
      result.user.role,
    );
    return { ...result, permissions };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.password);
  }

  @UseGuards(OrgJwtGuard)
  @Get('me')
  async me(@CurrentOrgUser() user: OrgJwtPayload) {
    const me = await this.authService.getMe(user.sub);
    const permissions = await this.permissions.resolve(
      user.organisationId,
      user.role,
    );
    return { ...me, permissions };
  }

  @UseGuards(OrgJwtGuard)
  @Post('change-password')
  changePassword(
    @CurrentOrgUser() user: OrgJwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentOrgUser } from './current-org-user.decorator';
import type { OrgJwtPayload } from './current-org-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { SetupAccountDto } from './dto/setup-account.dto';
import { OrgJwtGuard } from './org-jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('setup')
  setup(@Body() dto: SetupAccountDto) {
    return this.authService.setupAccount(dto.token, dto.password);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(OrgJwtGuard)
  @Get('me')
  me(@CurrentOrgUser() user: OrgJwtPayload) {
    return this.authService.getMe(user.sub);
  }

  // Org users update their password after they are already signed in.
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

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentSuperAdmin } from './current-super-admin.decorator';
import type { PlatformJwtPayload } from './current-super-admin.decorator';
import { LoginDto } from './dto/login.dto';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformJwtGuard } from './platform-jwt.guard';

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly platformAuth: PlatformAuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.platformAuth.login(dto.email, dto.password);
  }

  @UseGuards(PlatformJwtGuard)
  @Get('me')
  me(@CurrentSuperAdmin() admin: PlatformJwtPayload) {
    return this.platformAuth.getMe(admin.sub);
  }
}

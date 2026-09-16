import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { PlatformModule } from '../platform/platform.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OrgJwtGuard } from './org-jwt.guard';

@Module({
  imports: [
    PlatformModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET must be set');
        }
        return {
          secret,
          signOptions: { expiresIn: '8h' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OrgJwtGuard, PlatformApprovedGuard],
  exports: [AuthService, OrgJwtGuard, PlatformApprovedGuard, JwtModule, PlatformModule],
})
export class AuthModule {}

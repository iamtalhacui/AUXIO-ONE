import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformApprovedGuard } from '../../common/guards/platform-approved.guard';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlatformModule } from '../platform/platform.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OrgJwtGuard } from './org-jwt.guard';

@Module({
  imports: [
    PlatformModule,
    SubscriptionsModule,
    forwardRef(() => PermissionsModule),
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

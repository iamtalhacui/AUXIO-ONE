import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { authConfig } from '../../config/auth.config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { JwtAuthGlobalGuard } from '../../common/guards/jwt-auth-global.guard';
import { WorkforceLifecycleGuard } from '../../common/guards/workforce-lifecycle.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: authConfig.jwtSecret,
      signOptions: { expiresIn: authConfig.sessionDuration },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGlobalGuard,
    },
    {
      provide: APP_GUARD,
      useClass: WorkforceLifecycleGuard,
    },
  ],
  exports: [AuthService, JwtModule, PassportModule, RolesGuard],
})
export class AuthModule {}

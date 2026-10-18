import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import { PlatformPublicController } from './platform-public.controller';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

// Exported so AuthModule and OrganisationsModule can check/write platform state.
@Module({
  imports: [PlatformAuthModule],
  controllers: [PlatformController, PlatformPublicController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}

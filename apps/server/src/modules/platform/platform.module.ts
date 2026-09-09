import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

// Exported so AuthModule and OrganisationsModule can check/write platform state.
@Module({
  imports: [PlatformAuthModule],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}

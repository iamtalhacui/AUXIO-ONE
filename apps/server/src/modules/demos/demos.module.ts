import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import { DemosController } from './demos.controller';
import { DemosService } from './demos.service';
import { PlatformDemosController } from './platform-demos.controller';

@Module({
  imports: [PlatformAuthModule],
  controllers: [DemosController, PlatformDemosController],
  providers: [DemosService],
})
export class DemosModule {}

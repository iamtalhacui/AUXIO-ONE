import { Module } from '@nestjs/common';
import { LocalFileStorageService } from '../../common/storage/local-file-storage.service';
import { AuthModule } from '../auth/auth.module';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import { PlatformModule } from '../platform/platform.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PlatformPaymentsController } from './platform-payments.controller';

@Module({
  imports: [AuthModule, PlatformAuthModule, PlatformModule, SubscriptionsModule],
  controllers: [PaymentsController, PlatformPaymentsController],
  providers: [PaymentsService, LocalFileStorageService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { OrganisationModule } from './modules/organisation/organisation.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, OrganisationModule, AuthModule],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}

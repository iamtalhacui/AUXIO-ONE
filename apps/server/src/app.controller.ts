import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { SkipWorkforceGate } from './common/decorators/skip-workforce-gate.decorator';
import { AppService } from './app.service';

@Controller()
@SkipWorkforceGate()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

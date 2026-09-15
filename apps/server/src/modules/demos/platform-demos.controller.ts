import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PlatformJwtGuard } from '../platform-auth/platform-jwt.guard';
import { DemosService } from './demos.service';
import { UpdateDemoRequestStatusDto } from './dto/update-demo-request-status.dto';

@Controller('platform/demos')
@UseGuards(PlatformJwtGuard)
export class PlatformDemosController {
  constructor(private readonly demosService: DemosService) {}

  @Get()
  list() {
    return this.demosService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.demosService.getById(id);
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDemoRequestStatusDto) {
    return this.demosService.updateStatus(id, dto);
  }
}

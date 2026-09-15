import { Body, Controller, Post } from '@nestjs/common';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';
import { DemosService } from './demos.service';

/** Public Book a Demo submissions — no auth required. */
@Controller('demos')
export class DemosController {
  constructor(private readonly demosService: DemosService) {}

  @Post()
  create(@Body() dto: CreateDemoRequestDto) {
    return this.demosService.create(dto);
  }
}

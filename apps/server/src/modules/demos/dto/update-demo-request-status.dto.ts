import { IsEnum } from 'class-validator';
import { DemoRequestStatus } from 'database';

export class UpdateDemoRequestStatusDto {
  @IsEnum(DemoRequestStatus)
  status: DemoRequestStatus;
}

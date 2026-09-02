import { Injectable, Logger } from '@nestjs/common';
import type { JobScheduler } from './job-scheduler.interface';

@Injectable()
export class NoopJobSchedulerService implements JobScheduler {
  private readonly logger = new Logger(NoopJobSchedulerService.name);

  async enqueue<TPayload extends Record<string, unknown>>(
    jobName: string,
    payload: TPayload,
  ) {
    this.logger.debug(`Job queued (noop): ${jobName}`, payload);
  }
}

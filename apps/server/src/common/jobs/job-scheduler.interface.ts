/** Placeholder for future background work (notifications, expiry checks, exports). */
export const JOB_SCHEDULER = Symbol('JOB_SCHEDULER');

export interface JobScheduler {
  enqueue<TPayload extends Record<string, unknown>>(
    jobName: string,
    payload: TPayload,
    options?: { runAt?: Date },
  ): Promise<void>;
}

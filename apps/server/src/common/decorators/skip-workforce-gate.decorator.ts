import { SetMetadata } from '@nestjs/common';

export const SKIP_WORKFORCE_GATE_KEY = 'skipWorkforceGate';
export const SkipWorkforceGate = () => SetMetadata(SKIP_WORKFORCE_GATE_KEY, true);

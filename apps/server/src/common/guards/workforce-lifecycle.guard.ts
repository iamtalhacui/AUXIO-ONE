import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_WORKFORCE_GATE_KEY } from '../decorators/skip-workforce-gate.decorator';
import {
  isWorkforceLifecycleRole,
  isWorkforceOperationalStatus,
} from '../user-lifecycle';

@Injectable()
export class WorkforceLifecycleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_WORKFORCE_GATE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return true;

    const user = context.switchToHttp().getRequest().user;
    if (!isWorkforceLifecycleRole(user?.role)) return true;

    if (isWorkforceOperationalStatus(user?.status)) return true;

    throw new ForbiddenException(
      'Complete onboarding and approval before accessing this resource',
    );
  }
}

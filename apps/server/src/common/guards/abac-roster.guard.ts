import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AbacRosterGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

import { ForbiddenException } from '@nestjs/common';

/** Roles allowed to register team members. Extend with MANAGER when ready. */
export const TEAM_REGISTER_ALLOWED_ROLES = ['ORG_ADMIN'] as const;

export type TeamRegisterActorRole =
  (typeof TEAM_REGISTER_ALLOWED_ROLES)[number];

export function assertCanRegisterTeamMembers(actorRole?: string) {
  if (
    !actorRole ||
    !TEAM_REGISTER_ALLOWED_ROLES.includes(
      actorRole as TeamRegisterActorRole,
    )
  ) {
    throw new ForbiddenException(
      'You are not allowed to register team members',
    );
  }
}

import { IsString, MinLength } from 'class-validator';

export class ReopenTeamMemberDto {
  @IsString()
  @MinLength(3)
  reason: string;
}

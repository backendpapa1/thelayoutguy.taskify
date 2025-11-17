import { IsUUID } from 'class-validator';

export class AcceptInvitationDto {
  @IsUUID()
  workspaceId: string;
}
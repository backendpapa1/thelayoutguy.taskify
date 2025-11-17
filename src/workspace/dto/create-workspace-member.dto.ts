import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { WorkspaceMemberRole } from '../entities/workspace-member.entity';

export class CreateWorkspaceMemberDto {
  @IsUUID()
  workspaceId: string;

  @IsEmail()
  email: string;

  @IsEnum(WorkspaceMemberRole)
  @IsOptional()
  role?: WorkspaceMemberRole;
}

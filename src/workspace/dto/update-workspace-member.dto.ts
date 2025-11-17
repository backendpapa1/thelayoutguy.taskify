import { IsEnum, IsOptional } from 'class-validator';
import {
  WorkspaceMemberRole,
  WorkspaceMemberStatus,
} from '../entities/workspace-member.entity';

export class UpdateWorkspaceMemberDto {
  @IsEnum(WorkspaceMemberRole)
  @IsOptional()
  role?: WorkspaceMemberRole;

  @IsEnum(WorkspaceMemberStatus)
  @IsOptional()
  status?: WorkspaceMemberStatus;
}
import { IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  workspaceName: string;

  @IsString()
  workspaceDescription: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

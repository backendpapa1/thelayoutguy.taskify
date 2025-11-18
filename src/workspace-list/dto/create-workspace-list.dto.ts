import { IsString, IsOptional, IsHexColor, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateWorkspaceListDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}



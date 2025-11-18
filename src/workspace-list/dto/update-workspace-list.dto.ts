import { IsString, IsOptional, IsHexColor, MinLength, MaxLength } from 'class-validator';

export class UpdateWorkspaceListDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
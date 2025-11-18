import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkspaceDto } from './create-workspace.dto';

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) { }

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateWorkspaceIconDto {
  @IsString()
  @IsNotEmpty()
  icon: string; 
}
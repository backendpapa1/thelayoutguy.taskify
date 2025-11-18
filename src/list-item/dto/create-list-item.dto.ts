import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsArray,
  IsInt,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ListItemPriority } from '../entities/list-item.entity';

export class CreateListItemDto {
  @IsUUID()
  listId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(ListItemPriority)
  priority?: ListItemPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedTime?: number;
}

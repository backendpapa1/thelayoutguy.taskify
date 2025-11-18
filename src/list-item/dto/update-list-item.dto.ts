import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsInt,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ListItemPriority, ListItemStatus } from '../entities/list-item.entity';

export class UpdateListItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(ListItemPriority)
  priority?: ListItemPriority;

  @IsOptional()
  @IsEnum(ListItemStatus)
  status?: ListItemStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedTime?: number;

  @IsOptional()
  @IsString()
  coverImage?: string;
}

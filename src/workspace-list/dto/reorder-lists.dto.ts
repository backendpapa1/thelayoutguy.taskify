import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUUID, IsInt, Min } from 'class-validator';

export class ListPositionDto {
  @IsUUID()
  listId: string;

  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderListsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ListPositionDto)
  lists: ListPositionDto[];
}
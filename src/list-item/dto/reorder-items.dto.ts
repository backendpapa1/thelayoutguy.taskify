import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUUID, IsInt, Min } from 'class-validator';

export class ItemPositionDto {
  @IsUUID()
  itemId: string;

  @IsInt()
  @Min(0)
  position: number;
}

export class ReorderItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemPositionDto)
  items: ItemPositionDto[];
}
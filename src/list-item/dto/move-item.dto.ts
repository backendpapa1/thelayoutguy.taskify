import { IsUUID, IsInt, Min } from 'class-validator';

export class MoveItemDto {
  @IsUUID()
  targetListId: string;

  @IsInt()
  @Min(0)
  newPosition: number;
}

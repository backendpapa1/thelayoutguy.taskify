import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateChecklistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;
}
import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class LogTimeDto {
  @IsInt()
  @Min(1)
  duration: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
import { IsOptional, IsBoolean } from 'class-validator';

export class StartTimerDto {
  @IsOptional()
  @IsBoolean()
  isPomodoro?: boolean;
}
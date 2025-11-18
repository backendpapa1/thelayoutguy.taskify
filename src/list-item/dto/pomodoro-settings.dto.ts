import { IsInt, Min, Max } from 'class-validator';

export class PomodoroSettingsDto {
  @IsInt()
  @Min(1)
  @Max(60)
  workDuration: number; // Minutes

  @IsInt()
  @Min(1)
  @Max(30)
  breakDuration: number; // Minutes
}
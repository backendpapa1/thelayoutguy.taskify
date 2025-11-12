import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateAuthDto {
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

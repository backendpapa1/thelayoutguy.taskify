import { IAuthMethod } from '../entities/user.entity';

export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  authMethods: IAuthMethod[];
}

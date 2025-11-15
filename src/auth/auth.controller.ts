import {
  Controller,
  Post,
  Body,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UserService } from 'src/user/user.service';
import { HashService } from 'src/_services/security/hash.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('/signup')
  async signup(@Body() createAuthDto: CreateAuthDto) {
    const { name, password, email } = createAuthDto;

    const isEmailExists = await this.userService.isEmailExisting(email);
    if (isEmailExists)
      throw new ConflictException(
        'Failed to create account:User Already Exists',
      );

    const hash = await this.hashService.hashPassword(password);
    if (!hash)
      throw new InternalServerErrorException(
        'Failed to create account:Could not hash password',
      );

    const payload = {
      password: hash,
      email: email,
      name: name,
      authMethods: [
        {
          providerId: email,
          providerEmail: email,
          providerPassword: hash,
          type: 'EMAIL',
        },
      ],
    };

    const createUser =
      await this.authService.createUserAndPrivateWorkspaceTransaction(payload);
    if (!createUser.user.id || !createUser.workspace.id)
      throw new InternalServerErrorException(
        'Failed to create account: Could not complete request',
      );

    const responsePayload = {
      id: createUser.user.id,
      email: () =>
        createUser.user.authMethods.find((item) => item.type == 'EMAIL')
          ?.providerEmail,
    };

    const accessToken = await this.jwtService.signAsync({
      ...responsePayload,
      type: 'access',
    });

    return {
      user: responsePayload,
      access_token: accessToken,
    };
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userService.findByEmail(email);
    if (!user)
      throw new ConflictException('Failed to login:Email does not exist.');
    const findEmailProvider = user.authMethods.find(
      (item) => item.type === 'EMAIL',
    );

    if (!findEmailProvider)
      throw new ConflictException('Failed to login:Login method not listed.');
    const passwordHash = findEmailProvider?.providerPassword ?? '';
    const isPasswordValid = await this.hashService.verifyHash(
      passwordHash,
      password,
    );
    if (!isPasswordValid)
      throw new ConflictException('Failed to login: Password is incorrect!');

    const responsePayload = {
      id: user.id,
      email: () =>
        user.authMethods.find((item) => item.type == 'EMAIL')?.providerEmail,
    };

    const accessToken = await this.jwtService.signAsync({
      ...responsePayload,
      type: 'access',
    });

    return {
      user: responsePayload,
      access_token: accessToken,
    };
  }
}

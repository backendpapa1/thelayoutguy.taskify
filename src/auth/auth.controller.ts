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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
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

    const createUser = await this.userService.create(payload);
    if (!createUser)
      throw new InternalServerErrorException(
        'Failed to create account: Could not complete request',
      );

    const responsePayload = {
      id: createUser.id,
      email: () =>
        createUser.authMethods.find((item) => item.type == 'EMAIL')
          ?.providerEmail,
    };

    const accessToken = await this.jwtService.signAsync({
      ...responsePayload,
      type: 'access',
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        ...responsePayload,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    await this.authService.triggerAccountInitQueueSetup(createUser.id);
    return {
      user: responsePayload,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}

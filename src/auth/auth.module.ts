import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BullModule } from '@nestjs/bullmq';
import { UserService } from 'src/user/user.service';
import { HashService } from 'src/_services/security/hash.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountProducerService } from 'src/_services/queues/account-setup/account.producer';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UserModule,
    BullModule.registerQueue({
      name: 'account',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule, UserModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string | undefined>('JWT_SECRET'),
        signOptions: { expiresIn: '2d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, HashService, AccountProducerService],
})
export class AuthModule {}

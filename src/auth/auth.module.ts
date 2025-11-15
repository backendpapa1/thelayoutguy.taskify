import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BullModule } from '@nestjs/bullmq';
import { HashService } from 'src/_services/security/hash.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountProducerService } from 'src/_services/queues/account-setup/account.producer';
import { UserModule } from 'src/user/user.module';
import { AccountConsumer } from 'src/_services/queues/account-setup/account.consumer';
import { WorkspaceModule } from 'src/workspace/workspace.module';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from 'src/workspace/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Workspace]),
    UserModule,
    WorkspaceModule,
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
  providers: [
    AuthService,
    HashService,
    AccountProducerService,
    AccountConsumer,
  ],
})
export class AuthModule {}

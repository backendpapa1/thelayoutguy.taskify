import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BullModule } from '@nestjs/bullmq';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'account',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService],
})
export class AuthModule {}

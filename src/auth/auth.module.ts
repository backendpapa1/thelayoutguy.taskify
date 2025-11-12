import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports:[

    BullModule.registerQueue({
      name: 'account',
    });

  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

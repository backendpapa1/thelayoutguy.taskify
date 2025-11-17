import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { Workspace } from './entities/workspace.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceMemberService } from './workspace-member.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceMember]),
    JwtModule.registerAsync({
      imports: [ConfigModule, UserModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string | undefined>('JWT_SECRET'),
        signOptions: { expiresIn: '2d' },
      }),
    }),
    UserModule,
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspaceMemberService],
})
export class WorkspaceModule {}

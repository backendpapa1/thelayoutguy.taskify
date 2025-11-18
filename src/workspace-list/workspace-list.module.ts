import { Module } from '@nestjs/common';
import { WorkspaceListService } from './workspace-list.service';
import { WorkspaceListController } from './workspace-list.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceList } from './entities/workspace-list.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceList,Workspace,WorkspaceMember]),
    JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            global: true,
            secret: config.get<string | undefined>('JWT_SECRET'),
            signOptions: { expiresIn: '2d' },
          }),
        }),
    WorkspaceModule,
  ],
  controllers: [WorkspaceListController],
  providers: [WorkspaceListService],
})
export class WorkspaceListModule {}

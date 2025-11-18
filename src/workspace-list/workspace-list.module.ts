import { Module } from '@nestjs/common';
import { WorkspaceListService } from './workspace-list.service';
import { WorkspaceListController } from './workspace-list.controller';
import { WorkspaceModule } from '../workspace/workspace.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceList } from './entities/workspace-list.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';

@Module({
  controllers: [WorkspaceListController],
  providers: [WorkspaceListService],
  imports: [
    TypeOrmModule.forFeature([WorkspaceList,Workspace,WorkspaceMember]),
    WorkspaceModule
  ]
})
export class WorkspaceListModule {}

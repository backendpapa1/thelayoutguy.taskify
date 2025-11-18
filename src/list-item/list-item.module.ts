import { Module } from '@nestjs/common';
import { ListItemService } from './list-item.service';
import { ListItemController } from './list-item.controller';
import { ListItem } from './entities/list-item.entity';
import { ListItemComment } from './entities/list-item-comment.entity';
import { ListItemAttachment } from './entities/list-item-attachment.entity';
import { ListItemChecklist } from './entities/list-item-checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { ListItemActivity } from './entities/list-item-activity.entity';
import { TimeLog } from './entities/time-log.entity';
import { WorkspaceList } from '../workspace-list/entities/workspace-list.entity';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';
import { User } from '../user/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListItemCommentService } from './list-item-comment.service';
import { ListItemChecklistService } from './list-item-checklist.service';
import { ListItemAttachmentService } from './list-item-attachment.service';
import { TimeLogService } from './time-log.service';
import { ListItemActivityService } from './list-item-activity.service';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      ListItem,
      ListItemComment,
      ListItemAttachment,
      ListItemChecklist,
      ChecklistItem,
      ListItemActivity,
      TimeLog,
      WorkspaceList,
      WorkspaceMember,
      User,
    ]),
    ConfigModule,
  ],
  controllers: [ListItemController],
  providers: [
    ListItemService,
    ListItemCommentService,
    ListItemChecklistService,
    ListItemAttachmentService,
    TimeLogService,
    ListItemActivityService,
  ],
})
export class ListItemModule {}

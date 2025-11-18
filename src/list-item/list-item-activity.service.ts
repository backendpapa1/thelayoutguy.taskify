// src/list-item/list-item-activity.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListItemActivity } from './entities/list-item-activity.entity';
import { ListItem } from './entities/list-item.entity';
import { WorkspaceMember, WorkspaceMemberStatus } from '../workspace/entities/workspace-member.entity';

@Injectable()
export class ListItemActivityService {
  constructor(
    @InjectRepository(ListItemActivity)
    private activityRepository: Repository<ListItemActivity>,
    @InjectRepository(ListItem)
    private listItemRepository: Repository<ListItem>,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async getItemActivities(userId: string, itemId: string) {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['list', 'list.workspace'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: item.list.workspace.id,
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const activities = await this.activityRepository.find({
      where: { listItemId: itemId },
      relations: ['user'],
      select: {
        id: true,
        type: true,
        description: true,
        metadata: true,
        createdAt: true,
        user: {
          id: true,
          name: true,
          email: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      take: 100,
    });

    return activities;
  }
}
// src/list-item/list-item-checklist.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ListItemChecklist } from './entities/list-item-checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import { ListItem } from './entities/list-item.entity';
import { WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberStatus } from '../workspace/entities/workspace-member.entity';
import { ListItemActivity, ActivityType } from './entities/list-item-activity.entity';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';

@Injectable()
export class ListItemChecklistService {
  constructor(
    @InjectRepository(ListItemChecklist)
    private checklistRepository: Repository<ListItemChecklist>,
    @InjectRepository(ChecklistItem)
    private checklistItemRepository: Repository<ChecklistItem>,
    @InjectRepository(ListItem)
    private listItemRepository: Repository<ListItem>,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ListItemActivity)
    private activityRepository: Repository<ListItemActivity>,
  ) {}

  private async verifyItemAccess(
    userId: string,
    itemId: string,
  ): Promise<{ item: ListItem; member: WorkspaceMember }> {
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

    if (member.role === WorkspaceMemberRole.GUEST) {
      throw new ForbiddenException('Guests cannot modify checklists');
    }

    return { item, member };
  }

  private async updateChecklistProgress(itemId: string) {
    const checklists = await this.checklistRepository.find({
      where: { listItemId: itemId },
      relations: ['checklistItems'],
    });

    let totalItems = 0;
    let completedItems = 0;

    for (const checklist of checklists) {
      const items = await this.checklistItemRepository.find({
        where: { checklistId: checklist.id },
      });
      totalItems += items.length;
      completedItems += items.filter((item) => item.isCompleted).length;
    }

    await this.listItemRepository.update(
      { id: itemId },
      {
        checklistItemsTotal: totalItems,
        checklistItemsCompleted: completedItems,
      },
    );
  }

  async createChecklist(
    userId: string,
    itemId: string,
    createChecklistDto: CreateChecklistDto,
  ) {
    await this.verifyItemAccess(userId, itemId);

    const lastChecklist = await this.checklistRepository.findOne({
      where: { listItemId: itemId },
      order: { position: 'DESC' },
    });

    const nextPosition = lastChecklist ? lastChecklist.position + 1 : 0;

    const checklist = this.checklistRepository.create({
      title: createChecklistDto.title,
      listItemId: itemId,
      position: nextPosition,
      createdById: userId,
    });

    const savedChecklist = await this.checklistRepository.save(checklist);

    const activity = this.activityRepository.create({
      listItemId: itemId,
      userId,
      type: ActivityType.CHECKLIST_ADDED,
      description: `added checklist "${createChecklistDto.title}"`,
      metadata: { checklistId: savedChecklist.id },
    });
    await this.activityRepository.save(activity);

    return {
      message: 'Checklist created successfully',
      checklist: savedChecklist,
    };
  }

  async getItemChecklists(userId: string, itemId: string) {
    await this.verifyItemAccess(userId, itemId);

    const checklists = await this.checklistRepository.find({
      where: { listItemId: itemId },
      order: { position: 'ASC' },
    });

    const checklistsWithItems = await Promise.all(
      checklists.map(async (checklist) => {
        const items = await this.checklistItemRepository.find({
          where: { checklistId: checklist.id },
          relations: ['completedBy'],
          select: {
            id: true,
            content: true,
            isCompleted: true,
            position: true,
            completedAt: true,
            createdAt: true,
            completedBy: {
              id: true,
              name: true,
            },
          },
          order: { position: 'ASC' },
        });

        return {
          ...checklist,
          items,
          totalItems: items.length,
          completedItems: items.filter((item) => item.isCompleted).length,
        };
      }),
    );

    return checklistsWithItems;
  }

  async deleteChecklist(userId: string, checklistId: string) {
    const checklist = await this.checklistRepository.findOne({
      where: { id: checklistId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    await this.verifyItemAccess(userId, checklist.listItemId);

    await this.checklistRepository.remove(checklist);

    await this.updateChecklistProgress(checklist.listItemId);

    return {
      message: 'Checklist deleted successfully',
    };
  }

  async addChecklistItem(
    userId: string,
    checklistId: string,
    createItemDto: CreateChecklistItemDto,
  ) {
    const checklist = await this.checklistRepository.findOne({
      where: { id: checklistId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    await this.verifyItemAccess(userId, checklist.listItemId);

    const lastItem = await this.checklistItemRepository.findOne({
      where: { checklistId },
      order: { position: 'DESC' },
    });

    const nextPosition = lastItem ? lastItem.position + 1 : 0;

    const item = this.checklistItemRepository.create({
      content: createItemDto.content,
      checklistId,
      position: nextPosition,
    });

    const savedItem = await this.checklistItemRepository.save(item);

    await this.updateChecklistProgress(checklist.listItemId);

    return {
      message: 'Checklist item added successfully',
      item: savedItem,
    };
  }

  async toggleChecklistItem(userId: string, itemId: string) {
    const item = await this.checklistItemRepository.findOne({
      where: { id: itemId },
      relations: ['checklist'],
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    await this.verifyItemAccess(userId, item.checklist.listItemId);

    // Toggle completion
    item.isCompleted = !item.isCompleted;
    item.completedById = item.isCompleted ? userId : undefined;
    item.completedAt = item.isCompleted ? new Date() : undefined;

    await this.checklistItemRepository.save(item);

    await this.updateChecklistProgress(item.checklist.listItemId);

    const activity = this.activityRepository.create({
      listItemId: item.checklist.listItemId,
      userId,
      type: item.isCompleted
        ? ActivityType.CHECKLIST_ITEM_CHECKED
        : ActivityType.CHECKLIST_ITEM_UNCHECKED,
      description: item.isCompleted
        ? `completed "${item.content}" on ${item.checklist.title}`
        : `marked "${item.content}" as incomplete on ${item.checklist.title}`,
      metadata: { checklistItemId: itemId },
    });
    await this.activityRepository.save(activity);

    return {
      message: item.isCompleted
        ? 'Checklist item completed'
        : 'Checklist item marked incomplete',
      item,
    };
  }

  async updateChecklistItem(
    userId: string,
    itemId: string,
    content: string,
  ) {
    const item = await this.checklistItemRepository.findOne({
      where: { id: itemId },
      relations: ['checklist'],
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    await this.verifyItemAccess(userId, item.checklist.listItemId);

    item.content = content;
    await this.checklistItemRepository.save(item);

    return {
      message: 'Checklist item updated successfully',
      item,
    };
  }

  async deleteChecklistItem(userId: string, itemId: string) {
    const item = await this.checklistItemRepository.findOne({
      where: { id: itemId },
      relations: ['checklist'],
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    await this.verifyItemAccess(userId, item.checklist.listItemId);

    const listItemId = item.checklist.listItemId;

    await this.checklistItemRepository.remove(item);

    await this.updateChecklistProgress(listItemId);

    return {
      message: 'Checklist item deleted successfully',
    };
  }
}
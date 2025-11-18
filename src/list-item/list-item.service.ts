import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateListItemDto } from './dto/create-list-item.dto';
import { UpdateListItemDto } from './dto/update-list-item.dto';
import { ListItem } from './entities/list-item.entity';
import { In, Repository } from 'typeorm';
import { WorkspaceList } from '../workspace-list/entities/workspace-list.entity';
import { WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberStatus } from '../workspace/entities/workspace-member.entity';
import { User } from '../user/entities/user.entity';
import { ActivityType, ListItemActivity } from './entities/list-item-activity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MoveItemDto } from './dto/move-item.dto';
import AppDataSource from '../config/typeorm.config';
import { ReorderItemsDto } from './dto/reorder-items.dto';
import { AssignUserDto } from './dto/assign-user.dto';

@Injectable()
export class ListItemService {
  constructor(
    @InjectRepository(ListItem)
    private listItemRepository: Repository<ListItem>,
    @InjectRepository(WorkspaceList)
    private workspaceListRepository: Repository<WorkspaceList>,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ListItemActivity)
    private activityRepository: Repository<ListItemActivity>,
  ){}

  private async verifyWorkspaceMembershipThroughList(
    userId: string,
    listId: string,
  ): Promise<{ member: WorkspaceMember; list: WorkspaceList }> {
    const list = await this.workspaceListRepository.findOne({
      where: { id: listId },
      relations: ['workspace'],
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: list.workspaceId,
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return { member, list };
  }

  private verifyWritePermission(member: WorkspaceMember) {
    if (member.role === WorkspaceMemberRole.GUEST) {
      throw new ForbiddenException('Guests cannot modify items');
    }
  }

  private async logActivity(
    listItemId: string,
    userId: string,
    type: ActivityType,
    description: string,
    metadata?: any,
  ) {
    const activity = this.activityRepository.create({
      listItemId,
      userId,
      type,
      description,
      metadata,
    });
    await this.activityRepository.save(activity);
  }

  async createItem(userId: string, createItemDto: CreateListItemDto) {
    const { member, list } = await this.verifyWorkspaceMembershipThroughList(
      userId,
      createItemDto.listId,
    );
    this.verifyWritePermission(member);

    const lastItem = await this.listItemRepository.findOne({
      where: { listId: createItemDto.listId },
      order: { position: 'DESC' },
    });

    const nextPosition = lastItem ? lastItem.position + 1 : 0;

    let assignees: User[] = [];
    if (createItemDto.assigneeIds && createItemDto.assigneeIds.length > 0) {
      const assigneeMembers = await this.workspaceMemberRepository.find({
        where: {
          workspaceId: list.workspaceId,
          userId: In(createItemDto.assigneeIds),
          status: WorkspaceMemberStatus.ACTIVE,
        },
      });

      if (assigneeMembers.length !== createItemDto.assigneeIds.length) {
        throw new BadRequestException('Some assignees are not workspace members');
      }

      assignees = await this.userRepository.find({
        where: { id: In(createItemDto.assigneeIds) },
      });
    }

    const item = this.listItemRepository.create({
      title: createItemDto.title,
      description: createItemDto.description,
      listId: createItemDto.listId,
      position: nextPosition,
      priority: createItemDto.priority,
      dueDate: createItemDto.dueDate ? new Date(createItemDto.dueDate) : undefined,
      labels: createItemDto.labels,
      estimatedTime: createItemDto.estimatedTime,
      createdById: userId,
      assignees,
    });

    const savedItem = await this.listItemRepository.save(item);

    await this.workspaceListRepository.increment(
      { id: createItemDto.listId },
      'itemCount',
      1,
    );

    await this.logActivity(
      savedItem.id,
      userId,
      ActivityType.CREATED,
      'created this card',
    );

    delete (savedItem as Partial<ListItem>).list;
    delete (savedItem as Partial<ListItem>).createdBy;

    return {
      message: 'Item created successfully',
      item: savedItem,
    };
  }

  async getListItems(userId: string, listId: string) {
    await this.verifyWorkspaceMembershipThroughList(userId, listId);

    const items = await this.listItemRepository.find({
      where: {
        listId,
        isActive: true,
      },
      relations: ['assignees'],
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
        priority: true,
        status: true,
        dueDate: true,
        isOverdue: true,
        labels: true,
        coverImage: true,
        checklistItemsTotal: true,
        checklistItemsCompleted: true,
        commentsCount: true,
        attachmentsCount: true,
        trackedTime: true,
        estimatedTime: true,
        createdAt: true,
        updatedAt: true,
        assignees: {
          id: true,
          name: true,
          email: true,
        },
      },
      order: {
        position: 'ASC',
      },
    });

    return items;
  }

  async getItemById(userId: string, itemId: string) {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['assignees', 'list'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.verifyWorkspaceMembershipThroughList(userId, item.listId);

    const detailedItem = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['assignees', 'createdBy'],
      select: {
        assignees: {
          id: true,
          name: true,
          email: true,
        },
        createdBy: {
          id: true,
          name: true,
          email: true,
        },
      },
    });

    return detailedItem;
  }


  async updateItem(
    userId: string,
    itemId: string,
    updateItemDto: UpdateListItemDto,
  ) {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['list'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const { member } = await this.verifyWorkspaceMembershipThroughList(
      userId,
      item.listId,
    );
    this.verifyWritePermission(member);

    const changes: string[] = [];

    if (updateItemDto.title && updateItemDto.title !== item.title) {
      changes.push(`changed title to "${updateItemDto.title}"`);
      item.title = updateItemDto.title;
    }

    if (updateItemDto.description !== undefined) {
      changes.push('updated description');
      item.description = updateItemDto.description;
    }

    if (updateItemDto.priority && updateItemDto.priority !== item.priority) {
      changes.push(`changed priority to ${updateItemDto.priority}`);
      item.priority = updateItemDto.priority;
      await this.logActivity(
        itemId,
        userId,
        ActivityType.PRIORITY_CHANGED,
        `changed priority to ${updateItemDto.priority}`,
        { oldValue: item.priority, newValue: updateItemDto.priority },
      );
    }

    if (updateItemDto.status && updateItemDto.status !== item.status) {
      changes.push(`changed status to ${updateItemDto.status}`);
      item.status = updateItemDto.status;
      await this.logActivity(
        itemId,
        userId,
        ActivityType.STATUS_CHANGED,
        `changed status to ${updateItemDto.status}`,
        { oldValue: item.status, newValue: updateItemDto.status },
      );
    }

    if (updateItemDto.dueDate !== undefined) {
      const newDueDate = updateItemDto.dueDate ? new Date(updateItemDto.dueDate) : null;
      changes.push('updated due date');
      item.dueDate = newDueDate || undefined;
      await this.logActivity(
        itemId,
        userId,
        ActivityType.DUE_DATE_CHANGED,
        newDueDate ? `set due date to ${newDueDate.toDateString()}` : 'removed due date',
        { oldValue: item.dueDate, newValue: newDueDate },
      );
    }

    if (updateItemDto.labels !== undefined) {
      item.labels = updateItemDto.labels;
    }

    if (updateItemDto.estimatedTime !== undefined) {
      item.estimatedTime = updateItemDto.estimatedTime;
    }

    if (updateItemDto.coverImage !== undefined) {
      item.coverImage = updateItemDto.coverImage;
    }

    const updatedItem = await this.listItemRepository.save(item);

    if (changes.length > 0) {
      await this.logActivity(
        itemId,
        userId,
        ActivityType.UPDATED,
        changes.join(', '),
      );
    }

    delete (updatedItem as Partial<ListItem>).list;
    delete (updatedItem as Partial<ListItem>).createdBy;

    return {
      message: 'Item updated successfully',
      item: updatedItem,
    };
  }

  async moveItem(userId: string, itemId: string, moveItemDto: MoveItemDto) {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['list'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const { member: sourceMember } = await this.verifyWorkspaceMembershipThroughList(
      userId,
      item.listId,
    );
    this.verifyWritePermission(sourceMember);

    const { member: targetMember, list: targetList } =
      await this.verifyWorkspaceMembershipThroughList(userId, moveItemDto.targetListId);
    this.verifyWritePermission(targetMember);

    if (item.list.workspaceId !== targetList.workspaceId) {
      throw new BadRequestException('Cannot move item to a different workspace');
    }

    await AppDataSource.manager.transaction(async (manager) => {
      const oldListId = item.listId;
      const oldPosition = item.position;

      if (oldListId !== moveItemDto.targetListId) {
        await manager
          .createQueryBuilder()
          .update(ListItem)
          .set({ position: () => 'position - 1' })
          .where('listId = :listId', { listId: oldListId })
          .andWhere('position > :position', { position: oldPosition })
          .execute();

        await manager.decrement(WorkspaceList, { id: oldListId }, 'itemCount', 1);
        await manager.increment(
          WorkspaceList,
          { id: moveItemDto.targetListId },
          'itemCount',
          1,
        );
      }

      await manager
        .createQueryBuilder()
        .update(ListItem)
        .set({ position: () => 'position + 1' })
        .where('listId = :listId', { listId: moveItemDto.targetListId })
        .andWhere('position >= :position', { position: moveItemDto.newPosition })
        .andWhere('id != :itemId', { itemId })
        .execute();

      item.listId = moveItemDto.targetListId;
      item.position = moveItemDto.newPosition;
      await manager.save(item);
    });

    await this.logActivity(
      itemId,
      userId,
      ActivityType.MOVED,
      `moved this card from ${item.list.title} to ${targetList.title}`,
      {
        fromList: item.list.title,
        toList: targetList.title,
        fromPosition: item.position,
        toPosition: moveItemDto.newPosition,
      },
    );

    return {
      message: 'Item moved successfully',
    };
  }

  async reorderItems(userId: string, listId: string, reorderDto: ReorderItemsDto) {
    const { member } = await this.verifyWorkspaceMembershipThroughList(userId, listId);
    this.verifyWritePermission(member);

    const itemIds = reorderDto.items.map((i) => i.itemId);
    const items = await this.listItemRepository.find({
      where: {
        id: In(itemIds),
        listId,
      },
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException('Some items do not belong to this list');
    }

    await AppDataSource.manager.transaction(async (manager) => {
      for (const itemPosition of reorderDto.items) {
        await manager.update(
          ListItem,
          { id: itemPosition.itemId },
          { position: itemPosition.position },
        );
      }
    });

    return {
      message: 'Items reordered successfully',
    };
  }

  async assignUser(userId: string, itemId: string, assignUserDto: AssignUserDto) {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['assignees', 'list'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const { member, list } = await this.verifyWorkspaceMembershipThroughList(
      userId,
      item.listId,
    );
    this.verifyWritePermission(member);

    const assigneeMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: list.workspaceId,
        userId: assignUserDto.userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    if (!assigneeMember) {
      throw new BadRequestException('User is not a member of this workspace');
    }

    const isAlreadyAssigned = item.assignees.some(
      (assignee) => assignee.id === assignUserDto.userId,
    );

    if (isAlreadyAssigned) {
      throw new BadRequestException('User is already assigned to this item');
    }

    const assignee = await this.userRepository.findOne({
      where: { id: assignUserDto.userId },
    });
    
    if(!assignee) throw new NotFoundException("Assignee not found");

    item.assignees.push(assignee);
    await this.listItemRepository.save(item);

    await this.logActivity(
      itemId,
      userId,
      ActivityType.ASSIGNED,
      `assigned ${assignee?.name} to this card`,
      { assigneeId: assignee?.id, assigneeName: assignee?.name },
    );

    return {
      message: 'User assigned successfully',
      assignee: {
        id: assignee?.id,
        name: assignee?.name,
        email: assignee?.email,
      },
    };
  }

  async unassignUser(userId: string, itemId: string, assigneeId: string) {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
      relations: ['assignees'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const { member } = await this.verifyWorkspaceMembershipThroughList(
      userId,
      item.listId,
    );
    this.verifyWritePermission(member);

    const assigneeIndex = item.assignees.findIndex((a) => a.id === assigneeId);

    if (assigneeIndex === -1) {
      throw new BadRequestException('User is not assigned to this item');
    }

    const removedAssignee = item.assignees[assigneeIndex];
    item.assignees.splice(assigneeIndex, 1);
    await this.listItemRepository.save(item);

    await this.logActivity(
      itemId,
      userId,
      ActivityType.UNASSIGNED,
      `unassigned ${removedAssignee.name} from this card`,
      { assigneeId: removedAssignee.id, assigneeName: removedAssignee.name },
    );

    return {
      message: 'User unassigned successfully',
    };
  }

  async deleteItem(userId: string, itemId: string) {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const { member } = await this.verifyWorkspaceMembershipThroughList(
      userId,
      item.listId,
    );

    if (
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(member.role)
    ) {
      throw new ForbiddenException('Only owners and admins can delete items');
    }

    item.isActive = false;
    item.archivedAt = new Date();
    await this.listItemRepository.save(item);

    await this.workspaceListRepository.decrement(
      { id: item.listId },
      'itemCount',
      1,
    );

    await AppDataSource.manager
      .createQueryBuilder()
      .update(ListItem)
      .set({ position: () => 'position - 1' })
      .where('listId = :listId', { listId: item.listId })
      .andWhere('position > :position', { position: item.position })
      .andWhere('isActive = :isActive', { isActive: true })
      .execute();

    await this.logActivity(
      itemId,
      userId,
      ActivityType.ARCHIVED,
      'archived this card',
    );

    return {
      message: 'Item deleted successfully',
    };
  }

  async toggleArchive(userId: string, itemId: string) {
    const item = await this.listItemRepository.findOne({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const { member } = await this.verifyWorkspaceMembershipThroughList(
      userId,
      item.listId,
    );
    this.verifyWritePermission(member);

    item.isActive = !item.isActive;
    item.archivedAt = item.isActive ? undefined : new Date();
    await this.listItemRepository.save(item);

    await this.logActivity(
      itemId,
      userId,
      item.isActive ? ActivityType.RESTORED : ActivityType.ARCHIVED,
      item.isActive ? 'restored this card' : 'archived this card',
    );

    return {
      message: item.isActive ? 'Item restored successfully' : 'Item archived successfully',
    };
  }

}

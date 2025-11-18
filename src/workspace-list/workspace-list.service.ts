import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceListDto } from './dto/create-workspace-list.dto';
import { UpdateWorkspaceListDto } from './dto/update-workspace-list.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceList } from './entities/workspace-list.entity';
import { In, Repository } from 'typeorm';
import { Workspace } from '../workspace/entities/workspace.entity';
import { WorkspaceMember, WorkspaceMemberRole } from '../workspace/entities/workspace-member.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { ReorderListsDto } from './dto/reorder-lists.dto';
import AppDataSource from '../config/typeorm.config';

@Injectable()
export class WorkspaceListService {
  constructor(
    @InjectRepository(WorkspaceList)
    private workspaceListRepository: Repository<WorkspaceList>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    private readonly workspaceService: WorkspaceService,
    // private dataSource: DataSource,

  ){}
  
  async createList(userId: string, createListDto: CreateWorkspaceListDto) {
    const member = await this.workspaceService.verifyWorkspaceMembership(
      userId,
      createListDto.workspaceId,
    );
    this.workspaceService.verifyWritePermission(member);

    const workspace = await this.workspaceRepository.findOne({
      where: { id: createListDto.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const lastList = await this.workspaceListRepository.findOne({
      where: { workspaceId: createListDto.workspaceId },
      order: { position: 'DESC' },
    });

    const nextPosition = lastList ? lastList.position + 1 : 0;

    const list = this.workspaceListRepository.create({
      title: createListDto.title,
      description: createListDto.description,
      color: createListDto.color || '#6B7280',
      workspaceId: createListDto.workspaceId,
      position: nextPosition,
      createdById: userId,
    });

    const savedList = await this.workspaceListRepository.save(list);

    delete (savedList as Partial<WorkspaceList>).workspace;
    delete (savedList as Partial<WorkspaceList>).createdBy;

    return {
      message: 'List created successfully',
      list: savedList,
    };
  }

   async getWorkspaceLists(userId: string, workspaceId: string) {
    await this.workspaceService.verifyWorkspaceMembership(userId, workspaceId);

    const lists = await this.workspaceListRepository.find({
      where: {
        workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        color: true,
        position: true,
        itemCount: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
      },
      order: {
        position: 'ASC',
      },
    });

    return lists;
  }

  async getListById(userId: string, listId: string) {
    const list = await this.workspaceListRepository.findOne({
      where: { id: listId },
      select: {
        id: true,
        title: true,
        description: true,
        color: true,
        position: true,
        itemCount: true,
        workspaceId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.workspaceService.verifyWorkspaceMembership(userId, list.workspaceId);

    return list;
  }


  async updateList(
    userId: string,
    listId: string,
    updateListDto: UpdateWorkspaceListDto,
  ) {
    const list = await this.workspaceListRepository.findOne({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    
    const member = await this.workspaceService.verifyWorkspaceMembership(userId, list.workspaceId);
    this.workspaceService.verifyWritePermission(member);
 
    if (updateListDto.title !== undefined) {
      list.title = updateListDto.title;
    }
    if (updateListDto.description !== undefined) {
      list.description = updateListDto.description;
    }
    if (updateListDto.color !== undefined) {
      list.color = updateListDto.color;
    }

    const updatedList = await this.workspaceListRepository.save(list);

    delete (updatedList as Partial<WorkspaceList>).workspace;
    delete (updatedList as Partial<WorkspaceList>).createdBy;

    return {
      message: 'List updated successfully',
      list: updatedList,
    };
  }

  async reorderLists(
    userId: string,
    workspaceId: string,
    reorderDto: ReorderListsDto,
  ) {
    const member = await this.workspaceService.verifyWorkspaceMembership(userId, workspaceId);
    this.workspaceService.verifyWritePermission(member);


    const listIds = reorderDto.lists.map((l) => l.listId);
    const lists = await this.workspaceListRepository.find({
      where: {
        id: In(listIds),
        workspaceId,
      },
    });

    if (lists.length !== listIds.length) {
      throw new BadRequestException('Some lists do not belong to this workspace');
    }

    await AppDataSource.manager.transaction(async (manager) => {
      for (const listPosition of reorderDto.lists) {
        await manager.update(
          WorkspaceList,
          { id: listPosition.listId },
          { position: listPosition.position },
        );
      }
    });

    return {
      message: 'Lists reordered successfully',
    };
  }

  async deleteList(userId: string, listId: string) {
    const list = await this.workspaceListRepository.findOne({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    const member = await this.workspaceService.verifyWorkspaceMembership(userId, list.workspaceId);
    
    if (
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        member.role,
      )
    ) {
      throw new ForbiddenException('Only owners and admins can delete lists');
    }

    list.isActive = false;
    await this.workspaceListRepository.save(list);

    const remainingLists = await this.workspaceListRepository.find({
      where: {
        workspaceId: list.workspaceId,
        isActive: true,
      },
      order: {
        position: 'ASC',
      },
    });

    await AppDataSource.manager.transaction(async (manager) => {
      for (let i = 0; i < remainingLists.length; i++) {
        await manager.update(
          WorkspaceList,
          { id: remainingLists[i].id },
          { position: i },
        );
      }
    });

    return {
      message: 'List deleted successfully',
    };
  }


}

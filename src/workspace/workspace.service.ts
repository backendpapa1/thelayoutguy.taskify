import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto, UpdateWorkspaceIconDto } from './dto/update-workspace.dto';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { generateSlug } from 'random-word-slugs';
import {
  WorkspaceMember,
  WorkspaceMemberRole,
  WorkspaceMemberStatus,
} from './entities/workspace-member.entity';
import AppDataSource from 'src/config/typeorm.config';
import { PaginatedResponse, PaginationDto } from './dto/paginated-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    private readonly userService: UserService,
  ) {}
  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    return await AppDataSource.manager.transaction(
      async (transactionalEntityManager) => {
        const user = await this.userService.findById(userId);
        if (!user)
          throw new ConflictException(
            'Failed to create workspace:User not found',
          );
        const workspace_namespace = generateSlug(3);
        const workspace = this.workspaceRepository.create({
          workspaceSlug: workspace_namespace,
          workspaceName: createWorkspaceDto.workspaceName,
          owner: user,
          isPrivate: false,
          workspaceDesc:
            createWorkspaceDto.workspaceDescription ?? `My First Workspace`,
        });
        const savedWorkspace = await transactionalEntityManager.save(workspace);
        const ownerMember = this.workspaceMemberRepository.create({
          workspaceId: savedWorkspace.id,
          userId: userId,
          role: WorkspaceMemberRole.OWNER,
          status: WorkspaceMemberStatus.ACTIVE,
          isOwner: true,
          joinedAt: new Date(),
        });
        const savedWorkspaceMember =
          await transactionalEntityManager.save(ownerMember);
        return {
          workspace: {
            ...savedWorkspace,
            owner: { id: savedWorkspace.owner.id },
          },
          members: [savedWorkspaceMember],
        };
      },
    );
  }

  async findAll(userId: string, page: number = 1, limit: number = 10) {
    const user = await this.userService.findById(userId);
    if (!user) return [];
    const workspaces = await this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.owner', 'owner')
      .addSelect('owner.id')
      .where('owner.id = :userId', { userId })
      .skip(limit * (page - 1))
      .take(limit)
      .getMany();
    return workspaces;
  }

   async findAllForUser(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const total = await this.workspaceMemberRepository.count({
      where: {
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    const memberships = await this.workspaceMemberRepository.find({
      where: {
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: ['workspace', 'workspace.owner'],
      select: {
        id: true,
        role: true,
        isOwner: true,
        joinedAt: true,
        workspace: {
          id: true,
          workspaceName: true,
          workspaceDesc: true,
          workspaceSlug: true,
          isPrivate: true,
          sortOrder: true,
          isActive: true,
          owner: {
            id: true,
          },
        },
      },
      order: {
        workspace: {
          sortOrder: 'ASC',
        },
        joinedAt: 'DESC',
      },
      skip,
      take: limit,
    });

    const data = memberships.map((membership) => ({
      ...membership.workspace,
      memberRole: membership.role,
      isOwner: membership.isOwner,
      joinedAt: membership.joinedAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getPendingInvitations(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const total = await this.workspaceMemberRepository.count({
      where: {
        userId,
        status: WorkspaceMemberStatus.INVITED,
      },
    });

    const invitations = await this.workspaceMemberRepository.find({
      where: {
        userId,
        status: WorkspaceMemberStatus.INVITED,
      },
      relations: ['workspace', 'invitedBy'],
      select: {
        id: true,
        role: true,
        invitedAt: true,
        workspace: {
          id: true,
          workspaceName: true,
          workspaceDesc: true,
          workspaceSlug: true,
          isPrivate: true,
        },
        invitedBy: {
          id: true,
          name: true,
          email: true,
        },
      },
      order: {
        invitedAt: 'DESC',
      },
      skip,
      take: limit,
    });

    const data = invitations.map((invitation) => ({
      invitationId: invitation.id,
      workspace: invitation.workspace,
      role: invitation.role,
      invitedAt: invitation.invitedAt,
      invitedBy: invitation.invitedBy,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async updateWorkspaceIcon(
    userId: string,
    workspaceId: string,
    updateIconDto: UpdateWorkspaceIconDto,
  ) {
    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        member.role,
      )
    ) {
      throw new ForbiddenException(
        'Only workspace owners and admins can update the icon',
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      select: {
        id: true,
        workspaceName: true,
        workspaceSlug: true,
        icon: true,
        owner: {
          id: true
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    workspace.icon = updateIconDto.icon;
    const updatedWorkspace = await this.workspaceRepository.save(workspace);

    return {
      message: 'Workspace icon updated successfully',
      workspace: updatedWorkspace,
    };
  }

  async updateWorkspace(
    userId: string,
    workspaceId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    // 1. Check if user has permission (OWNER or ADMIN)
    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        member.role,
      )
    ) {
      throw new ForbiddenException(
        'Only workspace owners and admins can update workspace details',
      );
    }

    // 2. Find workspace
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 3. Update fields
    if (updateWorkspaceDto.workspaceName !== undefined) {
      workspace.workspaceName = updateWorkspaceDto.workspaceName;
    }
    if (updateWorkspaceDto.workspaceDescription !== undefined) {
      workspace.workspaceDesc = updateWorkspaceDto.workspaceDescription;
    }
    if (updateWorkspaceDto.icon !== undefined) {
      workspace.icon = updateWorkspaceDto.icon;
    }

    const updatedWorkspace = await this.workspaceRepository.save(workspace);

    return {
      message: 'Workspace updated successfully',
      workspace: updatedWorkspace,
    };
  }

  async getWorkspaceById(userId: string, workspaceId: string) {
    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      select: {
        id: true,
        workspaceName: true,
        workspaceDesc: true,
        workspaceSlug: true,
        icon: true,
        isPrivate: true,
        sortOrder: true,
        isActive: true,
        owner: {
          id: true
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      ...workspace,
      memberRole: member.role,
      isOwner: member.isOwner,
    };
  }

  async verifyWorkspaceMembership(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember> {
    const member = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return member;
  }

  
  verifyWritePermission(member: WorkspaceMember) {
    if (member.role === WorkspaceMemberRole.GUEST) {
      throw new ForbiddenException('Guests cannot modify workspace lists');
    }
  }


}

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceMember,
  WorkspaceMemberRole,
  WorkspaceMemberStatus,
} from './entities/workspace-member.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { User } from '../user/entities/user.entity';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';
import { PaginatedResponse, PaginationDto } from './dto/paginated-workspace.dto';

@Injectable()
export class WorkspaceMemberService {
  constructor(
    @InjectRepository(WorkspaceMember)
    private workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async addMember(
    requestingUserId: string,
    createMemberDto: CreateWorkspaceMemberDto,
  ) {
    const requestingMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: createMemberDto.workspaceId,
        userId: requestingUserId,
      },
    });

    if (
      !requestingMember ||
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        requestingMember.role,
      )
    ) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    const user = await this.userRepository.findOne({
      where: { email: createMemberDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: createMemberDto.workspaceId,
        userId: user.id,
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    const member = this.workspaceMemberRepository.create({
      workspaceId: createMemberDto.workspaceId,
      userId: user.id,
      role: createMemberDto.role || WorkspaceMemberRole.MEMBER,
      status: WorkspaceMemberStatus.INVITED,
      joinedAt: null,
      invitedById: requestingUserId,
      invitedAt: new Date(),
      user: user,
    });
    // sent invite queue message..

    const savedWorkspaceMember =
      await this.workspaceMemberRepository.save(member);
    return {
      ...savedWorkspaceMember,
      user: { id: savedWorkspaceMember.user.id },
    };
  }

  async inviteMember(
    requestingUserId: string,
    createMemberDto: CreateWorkspaceMemberDto,
  ) {
    
    const requestingMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: createMemberDto.workspaceId,
        userId: requestingUserId,
      },
    });

    if (
      !requestingMember ||
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        requestingMember.role,
      )
    ) {
      throw new ForbiddenException('You do not have permission to invite members');
    }

    const user = await this.userRepository.findOne({
      where: { email: createMemberDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 3. Check if already a member or invited
    const existingMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: createMemberDto.workspaceId,
        userId: user.id,
      },
    });

    if (existingMember) {
      if (existingMember.status === WorkspaceMemberStatus.ACTIVE) {
        throw new BadRequestException('User is already a member');
      }
      if (existingMember.status === WorkspaceMemberStatus.INVITED) {
        throw new BadRequestException('User already has a pending invitation');
      }
    }

    const member = this.workspaceMemberRepository.create({
      workspaceId: createMemberDto.workspaceId,
      userId: user.id,
      role: createMemberDto.role || WorkspaceMemberRole.MEMBER,
      status: WorkspaceMemberStatus.INVITED,
      invitedById: requestingUserId,
      invitedAt: new Date(),
    });

    const savedMember = await this.workspaceMemberRepository.save(member);

    // TODO: Send invitation email to user

    return {
      message: 'Invitation sent successfully',
      invitation: savedMember,
    };
  }

  async acceptInvitation(userId: string, workspaceId: string) {
    // 1. Find invitation
    const invitation = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: WorkspaceMemberStatus.INVITED,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already accepted');
    }

    invitation.status = WorkspaceMemberStatus.ACTIVE;
    invitation.joinedAt = new Date();

    await this.workspaceMemberRepository.save(invitation);

    return {
      message: 'Successfully joined workspace',
      membership: invitation,
    };
  }

  async declineInvitation(userId: string, workspaceId: string) {
    const invitation = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: WorkspaceMemberStatus.INVITED,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.workspaceMemberRepository.remove(invitation);

    return { message: 'Invitation declined' };
  }

  async getWorkspaceMembers(
    workspaceId: string,
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    // Verify user is a member
    const membership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Get total count of active members
    const total = await this.workspaceMemberRepository.count({
      where: {
        workspaceId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    // Get paginated members
    const members = await this.workspaceMemberRepository.find({
      where: {
        workspaceId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
      relations: ['user'],
      select: {
        id: true,
        role: true,
        status: true,
        isOwner: true,
        joinedAt: true,
        user: {
          id: true,
          name: true,
          email: true,
        },
      },
      order: {
        isOwner: 'DESC',
        role: 'ASC',
        joinedAt: 'ASC',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: members,
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

  async getWorkspaceInvitations(
    workspaceId: string,
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    // Check if requesting user is admin or owner
    const requestingMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
      },
    });

    if (
      !requestingMember ||
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        requestingMember.role,
      )
    ) {
      throw new ForbiddenException('You do not have permission to view invitations');
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const total = await this.workspaceMemberRepository.count({
      where: {
        workspaceId,
        status: WorkspaceMemberStatus.INVITED,
      },
    });

    const invitations = await this.workspaceMemberRepository.find({
      where: {
        workspaceId,
        status: WorkspaceMemberStatus.INVITED,
      },
      relations: ['user', 'invitedBy'],
      select: {
        id: true,
        role: true,
        invitedAt: true,
        user: {
          id: true,
          name: true,
          email: true,
        },
        invitedBy: {
          id: true,
          name: true,
        },
      },
      order: {
        invitedAt: 'DESC',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: invitations,
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

  // Cancel invitation (for admins/owners)
  async cancelInvitation(requestingUserId: string, invitationId: string) {
    const invitation = await this.workspaceMemberRepository.findOne({
      where: {
        id: invitationId,
        status: WorkspaceMemberStatus.INVITED,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check permission
    const requestingMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: invitation.workspaceId,
        userId: requestingUserId,
      },
    });

    if (
      !requestingMember ||
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        requestingMember.role,
      )
    ) {
      throw new ForbiddenException('You do not have permission to cancel invitations');
    }

    await this.workspaceMemberRepository.remove(invitation);

    return { message: 'Invitation cancelled' };
  }


  async updateMember(
    requestingUserId: string,
    memberId: string,
    updateMemberDto: UpdateWorkspaceMemberDto,
  ) {
    const member = await this.workspaceMemberRepository.findOne({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const requestingMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: member.workspaceId,
        userId: requestingUserId,
      },
    });

    if (
      !requestingMember ||
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        requestingMember.role,
      )
    ) {
      throw new ForbiddenException(
        'You do not have permission to update members',
      );
    }

    if (member.isOwner && updateMemberDto.role !== WorkspaceMemberRole.OWNER) {
      throw new BadRequestException(
        'Cannot change owner role. Use transfer ownership instead.',
      );
    }

    Object.assign(member, updateMemberDto);
    return await this.workspaceMemberRepository.save(member);
  }


  async removeMember(requestingUserId: string, memberId: string) {
    const member = await this.workspaceMemberRepository.findOne({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.isOwner) {
      throw new BadRequestException(
        'Cannot remove workspace owner. Transfer ownership first.',
      );
    }

    const requestingMember = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: member.workspaceId,
        userId: requestingUserId,
      },
    });

    if (
      !requestingMember ||
      ![WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN].includes(
        requestingMember.role,
      )
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove members',
      );
    }

    await this.workspaceMemberRepository.remove(member);
    return { message: 'Member removed successfully' };
  }

  async transferOwnership(
    currentOwnerId: string,
    workspaceId: string,
    newOwnerId: string,
  ) {
    const currentOwner = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: currentOwnerId,
        isOwner: true,
      },
    });

    if (!currentOwner) {
      throw new ForbiddenException('You are not the owner of this workspace');
    }

    const newOwner = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: newOwnerId,
      },
    });

    if (!newOwner)
      throw new BadRequestException('New owner must be a workspace member');

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) throw new BadRequestException('Unable to find workspace');

    workspace.owner = newOwner.user;
    await this.workspaceRepository.save(workspace);

    currentOwner.role = WorkspaceMemberRole.ADMIN;
    currentOwner.isOwner = false;
    await this.workspaceMemberRepository.save(currentOwner);

    newOwner.role = WorkspaceMemberRole.OWNER;
    newOwner.isOwner = true;
    await this.workspaceMemberRepository.save(newOwner);

    return { message: 'Ownership transferred successfully' };
  }

  async leaveWorkspace(userId: string, workspaceId: string) {
    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this workspace');
    }

    if (member.isOwner) {
      throw new BadRequestException(
        'Owner cannot leave workspace. Transfer ownership or delete workspace.',
      );
    }

    await this.workspaceMemberRepository.remove(member);
    return { message: 'Successfully left workspace' };
  }
}

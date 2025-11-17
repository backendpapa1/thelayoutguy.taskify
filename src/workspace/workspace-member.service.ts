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

  async getWorkspaceMembers(workspaceId: string, userId: string) {
    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return await this.workspaceMemberRepository.find({
      where: { workspaceId },
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
    });
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

    // Cannot remove owner
    if (member.isOwner) {
      throw new BadRequestException(
        'Cannot remove workspace owner. Transfer ownership first.',
      );
    }

    // Check if requesting user has permission
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

  // Transfer ownership
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

    // Update current owner to admin
    currentOwner.role = WorkspaceMemberRole.ADMIN;
    currentOwner.isOwner = false;
    await this.workspaceMemberRepository.save(currentOwner);

    // Update new owner
    newOwner.role = WorkspaceMemberRole.OWNER;
    newOwner.isOwner = true;
    await this.workspaceMemberRepository.save(newOwner);

    return { message: 'Ownership transferred successfully' };
  }

  // Leave workspace
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

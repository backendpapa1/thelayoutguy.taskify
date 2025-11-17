import { ConflictException, Injectable } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
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

  findOne(id: number) {
    return `This action returns a #${id} workspace`;
  }

  update(id: number, updateWorkspaceDto: UpdateWorkspaceDto) {
    return `This action updates a #${id} workspace`;
  }

  remove(id: number) {
    return `This action removes a #${id} workspace`;
  }
}

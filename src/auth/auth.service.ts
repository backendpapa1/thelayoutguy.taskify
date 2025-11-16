import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { generateSlug } from "random-word-slugs";
import { AccountProducerService } from 'src/_services/queues/account-setup/account.producer';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Repository } from 'typeorm';
import AppDataSource from 'src/config/typeorm.config';

@Injectable()
export class AuthService {
  constructor(
    private accountProducerService: AccountProducerService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
  ) {}

  async triggerAccountInitQueueSetup(id: string) {
    await this.accountProducerService.createDefaultPrivateWorkspaceJob(id);
  }

  async createUserAndPrivateWorkspaceTransaction(createUserDto: CreateUserDto) {
    return await AppDataSource.manager.transaction(
      async (transactionalEntityManager) => {
        const workspace_namespace = generateSlug(3);
        const user = this.usersRepository.create(createUserDto);
        const workspace = this.workspaceRepository.create({
          workspaceSlug: workspace_namespace,
          workspaceName: `${workspace_namespace.split('-').join(' ')}`,
          owner: user,
          isPrivate: true,
          workspaceDesc: `My First Workspace`,
        });
        const createdUser = await transactionalEntityManager.save(user);
        const createdWorkspace =
          await transactionalEntityManager.save(workspace);

        return {
          user: createdUser,
          workspace: createdWorkspace,
        };
      },
    );
  }
}

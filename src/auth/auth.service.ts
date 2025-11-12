import { Injectable } from '@nestjs/common';
import { AccountProducerService } from 'src/_services/queues/account-setup/account.producer';

@Injectable()
export class AuthService {
  constructor(private accountProducerService: AccountProducerService) {}

  async triggerAccountInitQueueSetup(id: string) {
    await this.accountProducerService.createDefaultPrivateWorkspaceJob(id);
  }
}

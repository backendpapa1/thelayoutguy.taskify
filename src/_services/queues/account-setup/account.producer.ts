import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AccountProducerService {
  constructor(@InjectQueue('account') private accountQueue: Queue) {}

  async setupAccountJobProduct() {
    await this.accountQueue.add('setup-account', {
      foo: 'bar',
    });
  }

  async createDefaultPrivateWorkspaceJob(id: string) {
    await this.accountQueue.add('create-private-workspace', {
      userId: id,
    });
  }
}

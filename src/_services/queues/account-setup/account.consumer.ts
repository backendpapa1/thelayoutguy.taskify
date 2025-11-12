import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('account')
export class AccountConsumer extends WorkerHost {
  @OnWorkerEvent('failed')
  onFailedJob(job: Job) {
    console.log('Job Failed', job.id);
  }
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'account-setup': {
        return await Promise.resolve({});
      }
    }
  }
}
